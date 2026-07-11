import { Injectable } from '@nestjs/common';
import { Prisma, WorkflowRuntimeExecution, WorkflowRuntimeLog } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowRunStatus } from '../enums/workflow-run-status.enum';

/** Running/completed/failed counts for the dashboard's status tiles. */
export interface WorkflowRunStatusCounts {
  running: number;
  completed: number;
  failed: number;
}

/**
 * Thin Prisma wrapper over clinic.workflow_runtime_executions and
 * clinic.workflow_runtime_logs - same one-repository-per-module,
 * one-line-per-Prisma-call shape ConversationsRepository/AiHistoryRepository
 * use. Mutable (unlike AiHistoryRepository): a run is created RUNNING and
 * updated in place as WorkflowExecutionService moves it through its
 * lifecycle.
 */
@Injectable()
export class WorkflowRuntimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.WorkflowRuntimeExecutionCreateInput): Promise<WorkflowRuntimeExecution> {
    return this.prisma.workflowRuntimeExecution.create({ data });
  }

  update(id: string, data: Prisma.WorkflowRuntimeExecutionUpdateInput): Promise<WorkflowRuntimeExecution> {
    return this.prisma.workflowRuntimeExecution.update({ where: { id }, data });
  }

  findById(id: string): Promise<WorkflowRuntimeExecution | null> {
    return this.prisma.workflowRuntimeExecution.findUnique({ where: { id } });
  }

  findMany(where: Prisma.WorkflowRuntimeExecutionWhereInput, take: number): Promise<WorkflowRuntimeExecution[]> {
    return this.prisma.workflowRuntimeExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take,
    });
  }

  createLog(data: Prisma.WorkflowRuntimeLogCreateInput): Promise<WorkflowRuntimeLog> {
    return this.prisma.workflowRuntimeLog.create({ data });
  }

  findLogsByRuntimeId(workflowRuntimeId: string): Promise<WorkflowRuntimeLog[]> {
    return this.prisma.workflowRuntimeLog.findMany({
      where: { workflowRuntimeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // AiOrchestratorService.generate() (ai.module.ts) doesn't return the
  // clinic.ai_execution_history row it just wrote (see AiExecutionResultDto -
  // no `id`), and AiHistoryService/AiHistoryRepository aren't exported by
  // AiOrchestratorModule (facade-only exports, see that module's doc
  // comment). Rather than duplicate AiHistoryService's persistence logic,
  // this reads the row AiOrchestratorService already wrote via the shared
  // (global) Prisma client - a read-only lookup, not a rewrite of AI
  // business logic - to link it onto the workflow run for the dashboard.
  findLatestAiExecutionId(conversationId: string, since: Date): Promise<string | null> {
    return this.prisma.aiExecutionHistory
      .findFirst({
        where: { conversationId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      .then((row) => row?.id ?? null);
  }

  // Dashboard's Running/Completed/Failed tiles - counted in Postgres, same
  // reasoning AiHistoryRepository.countByStatusSince() uses.
  async countByStatus(): Promise<WorkflowRunStatusCounts> {
    const [running, completed, failed] = await Promise.all([
      this.prisma.workflowRuntimeExecution.count({ where: { status: WorkflowRunStatus.RUNNING } }),
      this.prisma.workflowRuntimeExecution.count({ where: { status: WorkflowRunStatus.COMPLETED } }),
      this.prisma.workflowRuntimeExecution.count({ where: { status: WorkflowRunStatus.FAILED } }),
    ]);
    return { running, completed, failed };
  }

  // Dashboard's Average Runtime/AI Latency/Workflow Latency tiles - only
  // completed runs have a non-null durationMs/aiLatencyMs/workflowLatencyMs,
  // averaged in Postgres rather than pulled into Node.
  async averageDurationsForCompleted(): Promise<{
    averageRuntimeMs: number;
    averageAiLatencyMs: number;
    averageWorkflowLatencyMs: number;
  }> {
    const result = await this.prisma.workflowRuntimeExecution.aggregate({
      where: { status: WorkflowRunStatus.COMPLETED },
      _avg: { durationMs: true, aiLatencyMs: true, workflowLatencyMs: true },
    });
    return {
      averageRuntimeMs: Math.round(result._avg.durationMs ?? 0),
      averageAiLatencyMs: Math.round(result._avg.aiLatencyMs ?? 0),
      averageWorkflowLatencyMs: Math.round(result._avg.workflowLatencyMs ?? 0),
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, AiProvider } from '../../ai/providers/ai-provider.interface';
import { N8nService } from '../../n8n/n8n.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PhoneNumberService } from '../../whatsapp/phone-number.service';
import { QueryWorkflowRuntimeDto } from '../dto/query-workflow-runtime.dto';
import { WorkflowRuntimeDashboardStatsDto } from '../dto/workflow-runtime-dashboard-stats.dto';
import { WorkflowRuntimeExecutionDto } from '../dto/workflow-runtime-execution.dto';
import { WorkflowRuntimeHealthDto } from '../dto/workflow-runtime-health.dto';
import { WorkflowRuntimeLogDto } from '../dto/workflow-runtime-log.dto';
import { WorkflowRuntimeRepository } from '../repositories/workflow-runtime.repository';
import { toExecutionDto } from './workflow-execution.service';

/**
 * Read-side facade for the Automation Dashboard's workflow-runtime tiles and
 * for GET /api/workflow-runtime/health - the Sprint 21 brief's "Dashboard"
 * and "Health" sections. Never writes to clinic.workflow_runtime_executions/
 * logs (that's WorkflowExecutionService, called from
 * ConversationWorkflowService/WorkflowDispatcherService).
 */
@Injectable()
export class WorkflowRuntimeService {
  constructor(
    private readonly repository: WorkflowRuntimeRepository,
    private readonly prisma: PrismaService,
    private readonly n8nService: N8nService,
    private readonly phoneNumberService: PhoneNumberService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
  ) {}

  async findExecutions(query: QueryWorkflowRuntimeDto): Promise<WorkflowRuntimeExecutionDto[]> {
    const runs = await this.repository.findMany(
      {
        ...(query.status ? { status: query.status } : {}),
        ...(query.conversationId ? { conversationId: query.conversationId } : {}),
      },
      query.limit ?? 50,
    );
    return runs.map(toExecutionDto);
  }

  async findLogs(workflowRuntimeId: string): Promise<WorkflowRuntimeLogDto[]> {
    const logs = await this.repository.findLogsByRuntimeId(workflowRuntimeId);
    return logs.map((log) => ({
      id: log.id,
      workflowRuntimeId: log.workflowRuntimeId,
      step: log.step as WorkflowRuntimeLogDto['step'],
      status: log.status as WorkflowRuntimeLogDto['status'],
      message: log.message,
      metadata: log.metadata as Record<string, unknown>,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async getDashboardStats(): Promise<WorkflowRuntimeDashboardStatsDto> {
    const [statusCounts, averages] = await Promise.all([
      this.repository.countByStatus(),
      this.repository.averageDurationsForCompleted(),
    ]);
    const finished = statusCounts.completed + statusCounts.failed;
    const successRatePercent = finished === 0 ? 100 : Math.round((statusCounts.completed / finished) * 100);

    return {
      running: statusCounts.running,
      completed: statusCounts.completed,
      failed: statusCounts.failed,
      successRatePercent,
      ...averages,
    };
  }

  async getHealth(): Promise<WorkflowRuntimeHealthDto> {
    const [databaseHealthy, aiHealth, n8nHealth, whatsappHealth] = await Promise.all([
      this.prisma.isDatabaseHealthy(),
      this.aiProvider.checkHealth(),
      this.n8nService.checkHealth(),
      this.phoneNumberService.getHealth(),
    ]);

    const ai = { configured: aiHealth.configured, reachable: aiHealth.reachable };
    const n8n = { configured: n8nHealth.configured, reachable: n8nHealth.reachable };
    // WhatsappHealthDto only exposes a single combined `connected` flag
    // (configured + a real Graph API call succeeding) - see that DTO's doc
    // comment - so both fields mirror it rather than inventing a split it
    // doesn't make.
    const whatsapp = { configured: whatsappHealth.connected, reachable: whatsappHealth.connected };

    const allHealthy = databaseHealthy && ai.reachable && n8n.reachable && whatsapp.reachable;
    const allDown = !databaseHealthy && !ai.reachable && !n8n.reachable && !whatsapp.reachable;

    return {
      status: allHealthy ? 'ok' : allDown ? 'error' : 'degraded',
      timestamp: new Date().toISOString(),
      ai,
      whatsapp,
      n8n,
      database: databaseHealthy ? 'up' : 'down',
    };
  }
}

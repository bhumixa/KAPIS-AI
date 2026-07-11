import { Injectable } from '@nestjs/common';
import { Prisma, WorkflowRuntimeExecution } from '@prisma/client';
import { WorkflowDecision } from '../enums/workflow-decision.enum';
import { WorkflowRunStatus } from '../enums/workflow-run-status.enum';
import { WorkflowStep, WorkflowStepStatus } from '../enums/workflow-step.enum';
import { WorkflowRuntimeExecutionDto } from '../dto/workflow-runtime-execution.dto';
import { WorkflowRuntimeRepository } from '../repositories/workflow-runtime.repository';

export interface StartRunInput {
  conversationId: string | null;
  messageId: string | null;
  whatsappMessageId: string | null;
  triggerSource: string;
}

export interface CompleteRunInput {
  decision: WorkflowDecision;
  aiExecutionId: string | null;
  n8nExecutionId: string | null;
  aiLatencyMs: number | null;
  workflowLatencyMs: number | null;
}

/**
 * Owns the lifecycle of a single clinic.workflow_runtime_executions row plus
 * its clinic.workflow_runtime_logs trace - the "History: persist workflow
 * execution ... all linked together" requirement from the Sprint 21 brief.
 * ConversationWorkflowService/WorkflowDispatcherService call this instead of
 * touching WorkflowRuntimeRepository directly, so every write to the run row
 * goes through one place that always keeps status/timestamps consistent.
 */
@Injectable()
export class WorkflowExecutionService {
  constructor(private readonly repository: WorkflowRuntimeRepository) {}

  async startRun(input: StartRunInput): Promise<WorkflowRuntimeExecutionDto> {
    const run = await this.repository.create({
      conversationId: input.conversationId,
      messageId: input.messageId,
      whatsappMessageId: input.whatsappMessageId,
      triggerSource: input.triggerSource,
      status: WorkflowRunStatus.RUNNING,
    });
    await this.logStep(run.id, WorkflowStep.RECEIVED, WorkflowStepStatus.SUCCESS, 'Incoming message accepted into the workflow runtime.');
    return toExecutionDto(run);
  }

  async logStep(
    workflowRuntimeId: string,
    step: WorkflowStep,
    status: WorkflowStepStatus,
    message: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.repository.createLog({
      workflowRuntimeId,
      step,
      status,
      message,
      metadata: metadata as Prisma.InputJsonValue,
    });
  }

  async recordRetry(workflowRuntimeId: string, step: WorkflowStep, attempt: number, error: string): Promise<void> {
    const run = await this.repository.update(workflowRuntimeId, {
      status: WorkflowRunStatus.RETRYING,
      retryCount: { increment: 1 },
    });
    await this.logStep(workflowRuntimeId, WorkflowStep.RETRY, WorkflowStepStatus.FAILED, `Attempt ${attempt} of "${step}" failed: ${error}`, {
      step,
      attempt,
      retryCount: run.retryCount,
    });
  }

  async completeRun(workflowRuntimeId: string, input: CompleteRunInput): Promise<WorkflowRuntimeExecutionDto> {
    const existing = await this.repository.findById(workflowRuntimeId);
    const completedAt = new Date();
    const durationMs = existing ? completedAt.getTime() - existing.startedAt.getTime() : null;

    const run = await this.repository.update(workflowRuntimeId, {
      status: WorkflowRunStatus.COMPLETED,
      decision: input.decision,
      aiExecutionId: input.aiExecutionId,
      n8nExecutionId: input.n8nExecutionId,
      aiLatencyMs: input.aiLatencyMs,
      workflowLatencyMs: input.workflowLatencyMs,
      completedAt,
      durationMs,
    });
    await this.logStep(workflowRuntimeId, WorkflowStep.HISTORY_PERSISTED, WorkflowStepStatus.SUCCESS, `Run completed with decision "${input.decision}".`);
    return toExecutionDto(run);
  }

  async failRun(workflowRuntimeId: string, step: WorkflowStep, errorMessage: string): Promise<WorkflowRuntimeExecutionDto> {
    const existing = await this.repository.findById(workflowRuntimeId);
    const completedAt = new Date();
    const durationMs = existing ? completedAt.getTime() - existing.startedAt.getTime() : null;

    const run = await this.repository.update(workflowRuntimeId, {
      status: WorkflowRunStatus.FAILED,
      errorMessage,
      completedAt,
      durationMs,
    });
    await this.logStep(workflowRuntimeId, WorkflowStep.FAILED, WorkflowStepStatus.FAILED, errorMessage, { step });
    return toExecutionDto(run);
  }
}

export function toExecutionDto(run: WorkflowRuntimeExecution): WorkflowRuntimeExecutionDto {
  return {
    id: run.id,
    conversationId: run.conversationId,
    messageId: run.messageId,
    whatsappMessageId: run.whatsappMessageId,
    aiExecutionId: run.aiExecutionId,
    n8nExecutionId: run.n8nExecutionId,
    triggerSource: run.triggerSource,
    decision: run.decision as WorkflowDecision | null,
    status: run.status as WorkflowRunStatus,
    retryCount: run.retryCount,
    aiLatencyMs: run.aiLatencyMs,
    workflowLatencyMs: run.workflowLatencyMs,
    durationMs: run.durationMs,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}

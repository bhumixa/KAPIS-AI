import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WhatsappIncomingMessageEvent, WorkflowEventsService } from '../../common/events/workflow-events.service';
import { AiOrchestratorService } from '../../ai/ai-orchestrator.service';
import { ConversationService } from '../../conversations/conversation.service';
import { WorkflowDecision } from '../enums/workflow-decision.enum';
import { WorkflowStep, WorkflowStepStatus } from '../enums/workflow-step.enum';
import { WorkflowRuntimeExecutionDto } from '../dto/workflow-runtime-execution.dto';
import { WorkflowRuntimeRepository } from '../repositories/workflow-runtime.repository';
import { WorkflowDispatcherService } from './workflow-dispatcher.service';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowRetryService } from './workflow-retry.service';

/**
 * The Sprint 21 end-to-end pipeline: Incoming WhatsApp -> Conversation
 * Engine (already done by WebhookService before this runs) -> RAG Context
 * Builder -> AI Orchestrator -> AI Provider -> n8n Workflow -> Decision ->
 * Send WhatsApp Reply -> Persist History. Reacts to
 * WorkflowEventsService's whatsapp.incoming-message event (emitted by
 * webhook.service.ts) instead of being called directly, so WhatsappModule
 * never needs to depend on WorkflowRuntimeModule (see
 * common/events/workflow-events.module.ts's doc comment). Every domain
 * step is delegated to the Sprint 15-20 service that already owns it -
 * AiOrchestratorService alone covers "RAG Context Builder -> AI
 * Orchestrator -> AI Provider" (see its own doc comment on why callers
 * don't compose ConversationContextBuilderService/PromptBuilderService
 * themselves), WorkflowDispatcherService covers "n8n Workflow -> Decision
 * -> Send WhatsApp Reply" plus (Sprint 25) booking/reschedule/cancel.
 */
@Injectable()
export class ConversationWorkflowService implements OnModuleInit {
  private readonly logger = new Logger(ConversationWorkflowService.name);

  constructor(
    private readonly workflowEvents: WorkflowEventsService,
    private readonly aiOrchestrator: AiOrchestratorService,
    private readonly dispatcher: WorkflowDispatcherService,
    private readonly conversationService: ConversationService,
    private readonly executionService: WorkflowExecutionService,
    private readonly retryService: WorkflowRetryService,
    private readonly repository: WorkflowRuntimeRepository,
  ) {}

  onModuleInit(): void {
    this.workflowEvents.onWhatsappIncomingMessage((payload) => {
      this.handleIncomingMessage(payload).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown workflow runtime error';
        this.logger.error(`Unhandled error running the workflow for conversation ${payload.conversationId}: ${message}`);
      });
    });
  }

  async handleIncomingMessage(payload: WhatsappIncomingMessageEvent): Promise<WorkflowRuntimeExecutionDto> {
    const pipelineStartedAt = new Date();
    const run = await this.executionService.startRun({
      conversationId: payload.conversationId,
      messageId: payload.messageId,
      whatsappMessageId: payload.whatsappMessageId,
      triggerSource: 'whatsapp_webhook',
    });

    try {
      const aiStartedAt = Date.now();
      const aiResult = await this.retryService.run(
        () => this.aiOrchestrator.generate({ conversationId: payload.conversationId }),
        {
          onRetry: (attempt, error) =>
            this.executionService.recordRetry(run.id, WorkflowStep.AI_EXECUTED, attempt, error.message),
        },
      );
      const aiLatencyMs = Date.now() - aiStartedAt;

      await this.executionService.logStep(
        run.id,
        WorkflowStep.CONTEXT_BUILT,
        WorkflowStepStatus.SUCCESS,
        'RAG context assembled by ConversationContextBuilderService/KnowledgeRetrievalService.',
      );
      await this.executionService.logStep(
        run.id,
        WorkflowStep.AI_EXECUTED,
        WorkflowStepStatus.SUCCESS,
        `AI Orchestrator produced a response (finishReason: ${aiResult.finishReason}, ${aiResult.totalTokens} tokens, ${aiLatencyMs}ms).`,
      );

      const aiExecutionId = await this.repository.findLatestAiExecutionId(payload.conversationId, pipelineStartedAt);

      const decision = this.dispatcher.decide(aiResult);
      await this.executionService.logStep(run.id, WorkflowStep.DECISION_MADE, WorkflowStepStatus.SUCCESS, `Decision: ${decision}.`);

      // Sprint 25 - persist what the AI understood *before* dispatching side
      // effects, so a crash mid-dispatch doesn't lose it. WorkflowDispatcherService's
      // booking/reschedule/cancel handlers overwrite this again with cleared
      // state on success (see clearConversationState()) - an in-progress
      // multi-turn collection is what's left behind on a clarification/failure.
      await this.conversationService.updateAiState(payload.conversationId, {
        lastIntent: aiResult.intent,
        lastIntentConfidence: aiResult.confidence,
        pendingAction:
          decision === WorkflowDecision.AUTO_REPLY && aiResult.requiresFollowUp
            ? aiResult.intent === 'CANCEL_APPOINTMENT'
              ? 'AWAITING_CONFIRMATION'
              : 'COLLECTING_FIELDS'
            : null,
        collectedFields: aiResult.collectedFields,
      });

      // EMERGENCY never triggers n8n - guidance goes straight back to the
      // patient, nothing else should run concurrently against this conversation.
      const { execution: n8nExecution, latencyMs: workflowLatencyMs } =
        decision === WorkflowDecision.EMERGENCY
          ? { execution: null, latencyMs: 0 }
          : await this.dispatcher.triggerWorkflow(run.id, payload.conversationId, decision, aiResult);

      await this.dispatcher.dispatch(run.id, payload.conversationId, decision, aiResult);

      return await this.executionService.completeRun(run.id, {
        decision,
        aiExecutionId,
        n8nExecutionId: n8nExecution?.id ?? null,
        aiLatencyMs,
        workflowLatencyMs,
        intent: aiResult.intent,
        intentConfidence: aiResult.confidence,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown workflow runtime error';
      this.logger.error(`Run ${run.id} failed: ${message}`);
      return this.executionService.failRun(run.id, WorkflowStep.FAILED, message);
    }
  }
}

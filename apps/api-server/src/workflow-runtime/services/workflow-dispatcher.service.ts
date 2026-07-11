import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiExecutionResultDto } from '../../ai/dto/ai-execution.dto';
import { AppConfig } from '../../config/configuration';
import { ConversationService } from '../../conversations/conversation.service';
import { WorkflowExecutionDto } from '../../n8n/dto/workflow-execution.dto';
import { N8nService } from '../../n8n/n8n.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { WorkflowDecision } from '../enums/workflow-decision.enum';
import { WorkflowStep, WorkflowStepStatus } from '../enums/workflow-step.enum';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowRetryService } from './workflow-retry.service';

// Phrases that mean "a human needs to look at this" even though the AI
// produced a real answer - a deliberately small, readable v1 heuristic
// (not an NLP classifier) that ConversationWorkflowService can extend as
// more signals are needed. Falls back to a Claude-side failure (generate()
// throwing) always meaning HANDOFF too - see decide().
const HANDOFF_PHRASES = [
  "i don't know",
  "i'm not sure",
  'i am not sure',
  'cannot help',
  "can't help",
  'speak to a doctor',
  'speak with a doctor',
  'contact the clinic directly',
  'emergency',
  'call 911',
  'call emergency services',
];

/**
 * Decides what an AI-drafted reply means for the conversation (Sprint 21's
 * AUTO_REPLY/CREATE_TASK/HANDOFF/NO_ACTION enum) and carries the decision
 * out: triggers the real n8n workflow (reusing N8nService, Sprint 15) and,
 * for AUTO_REPLY/HANDOFF, acts on the conversation via WhatsappService
 * (Sprint 20, send) / ConversationService (Sprint 16, status). Never talks
 * to Prisma directly - all persistence goes back through
 * WorkflowExecutionService.
 */
@Injectable()
export class WorkflowDispatcherService {
  private readonly logger = new Logger(WorkflowDispatcherService.name);
  private readonly n8nWorkflowId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly n8nService: N8nService,
    private readonly whatsappService: WhatsappService,
    private readonly conversationService: ConversationService,
    private readonly retryService: WorkflowRetryService,
    private readonly executionService: WorkflowExecutionService,
  ) {
    const config = this.configService.get<AppConfig['workflowRuntime']>('app.workflowRuntime')!;
    this.n8nWorkflowId = config.n8nWorkflowId;
  }

  decide(aiResult: AiExecutionResultDto): WorkflowDecision {
    const response = aiResult.response.trim();
    if (!response) {
      return WorkflowDecision.NO_ACTION;
    }

    const lower = response.toLowerCase();
    if (HANDOFF_PHRASES.some((phrase) => lower.includes(phrase))) {
      return WorkflowDecision.HANDOFF;
    }

    return WorkflowDecision.AUTO_REPLY;
  }

  /** Triggers the registered n8n workflow (default: "conversation-routing") for every run, regardless of decision - the brief's flow always includes this step. */
  async triggerWorkflow(
    workflowRuntimeId: string,
    conversationId: string,
    decision: WorkflowDecision,
    aiResult: AiExecutionResultDto,
  ): Promise<{ execution: WorkflowExecutionDto; latencyMs: number }> {
    const startedAt = Date.now();

    const execution = await this.retryService.run(
      () =>
        this.n8nService.triggerWorkflow(this.n8nWorkflowId, {
          triggeredBy: 'workflow-runtime',
          payload: {
            conversationId,
            decision,
            aiResponsePreview: aiResult.response.slice(0, 200),
          },
        }),
      {
        onRetry: (attempt, error) =>
          this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.N8N_TRIGGERED, attempt, error.message),
      },
    );

    await this.executionService.logStep(
      workflowRuntimeId,
      WorkflowStep.N8N_TRIGGERED,
      execution.status === 'success' ? WorkflowStepStatus.SUCCESS : WorkflowStepStatus.FAILED,
      execution.status === 'success' ? 'n8n workflow triggered.' : (execution.errorMessage ?? 'n8n workflow trigger failed.'),
      { n8nExecutionId: execution.id },
    );

    return { execution, latencyMs: Date.now() - startedAt };
  }

  /** Carries out the decision: AUTO_REPLY sends the AI draft out, HANDOFF hands the conversation to a human, CREATE_TASK/NO_ACTION need no further external action today. */
  async dispatch(
    workflowRuntimeId: string,
    conversationId: string,
    decision: WorkflowDecision,
    aiResult: AiExecutionResultDto,
  ): Promise<void> {
    switch (decision) {
      case WorkflowDecision.AUTO_REPLY:
        await this.retryService.run(
          () =>
            this.whatsappService.sendMessage({
              conversationId,
              type: 'text',
              body: aiResult.response,
              sender: 'ai',
              senderName: 'AI Assistant',
            }),
          {
            onRetry: (attempt, error) =>
              this.executionService.recordRetry(workflowRuntimeId, WorkflowStep.REPLY_SENT, attempt, error.message),
          },
        );
        await this.executionService.logStep(workflowRuntimeId, WorkflowStep.REPLY_SENT, WorkflowStepStatus.SUCCESS, 'AI reply sent via WhatsApp.');
        break;

      case WorkflowDecision.HANDOFF:
        await this.conversationService.update(conversationId, { status: 'waiting' });
        await this.executionService.logStep(
          workflowRuntimeId,
          WorkflowStep.REPLY_SENT,
          WorkflowStepStatus.SUCCESS,
          'Conversation handed off to a human - moved to "waiting".',
        );
        break;

      case WorkflowDecision.CREATE_TASK:
        this.logger.log(`Run ${workflowRuntimeId}: decision CREATE_TASK recorded - no task backend exists yet (Sprint 21 scope).`);
        await this.executionService.logStep(
          workflowRuntimeId,
          WorkflowStep.REPLY_SENT,
          WorkflowStepStatus.SUCCESS,
          'Decision recorded as CREATE_TASK - no task backend to dispatch to yet.',
        );
        break;

      case WorkflowDecision.NO_ACTION:
        await this.executionService.logStep(workflowRuntimeId, WorkflowStep.REPLY_SENT, WorkflowStepStatus.SUCCESS, 'No action taken.');
        break;
    }
  }
}

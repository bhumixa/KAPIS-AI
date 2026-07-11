import { Injectable } from '@nestjs/common';
import { AiExecutionService } from './ai-execution.service';
import { AiHistoryService } from './ai-history.service';
import { ConversationContextBuilderService } from './conversation-context-builder.service';
import { AiConversationContextDto } from './dto/ai-conversation-context.dto';
import { AiExecutionResultDto } from './dto/ai-execution.dto';
import { GenerateRequestDto } from './dto/generate-request.dto';
import { PromptDto } from './dto/prompt.dto';
import { PromptBuilderService } from './prompt-builder.service';

/**
 * The single entry point for the AI pipeline described in the Sprint 17/18
 * brief's architecture diagram: Conversation -> Context Builder -> Prompt
 * Builder -> AI Orchestrator -> AI Provider -> History -> Angular. Every
 * caller that wants a context, a prompt preview, or a generated reply goes
 * through here rather than composing ConversationContextBuilderService/
 * PromptBuilderService/AIExecutionService/AIHistoryService directly.
 * AIExecutionService is the only thing downstream of this service that holds
 * an AiProvider dependency (Sprint 18) - this class never imports Claude or
 * any other provider, matching the brief's isolation requirement one layer
 * down. AIController (context/prompt/generate endpoints) and, per the Sprint
 * 17 brief's "Workflow Integration" requirement, anything acting as a
 * workflow trigger (e.g. a future n8n conversation-routing callback) are both
 * expected to call this service instead of drafting a reply themselves.
 */
@Injectable()
export class AiOrchestratorService {
  constructor(
    private readonly contextBuilder: ConversationContextBuilderService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly executionService: AiExecutionService,
    private readonly historyService: AiHistoryService,
  ) {}

  getContext(conversationId: string): Promise<AiConversationContextDto> {
    return this.contextBuilder.build(conversationId);
  }

  async getPromptPreview(
    conversationId: string,
    templateType?: GenerateRequestDto['templateType'],
    userQuestion?: string,
  ): Promise<PromptDto> {
    const context = await this.contextBuilder.build(conversationId);
    return this.promptBuilder.build(context, templateType, userQuestion);
  }

  /**
   * The full pipeline: build context, build prompt, run the execution via the
   * bound AiProvider, persist it to history, and return the execution result.
   * A failed execution (Claude API error, timeout, missing config - see
   * ClaudeProviderService) is recorded to history as `status: 'failed'` with
   * the real provider/model it was attempted against (via
   * AIExecutionService.getProviderInfo(), never a network call) and then
   * rethrown, so the controller surfaces a real HTTP error instead of
   * silently returning an empty draft.
   */
  async generate(request: GenerateRequestDto): Promise<AiExecutionResultDto> {
    const context = await this.contextBuilder.build(request.conversationId);
    const prompt = await this.promptBuilder.build(
      context,
      request.templateType,
      request.userQuestion,
    );

    try {
      const result = await this.executionService.execute(prompt);
      await this.historyService.record(prompt, result, 'success');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI execution error';
      const providerInfo = this.executionService.getProviderInfo();
      const failedResult: AiExecutionResultDto = {
        response: '',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: providerInfo.model,
        provider: providerInfo.provider,
        latencyMs: 0,
        finishReason: 'error',
      };
      await this.historyService.record(prompt, failedResult, 'failed', message);
      throw error;
    }
  }
}

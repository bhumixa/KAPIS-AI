import { Inject, Injectable } from '@nestjs/common';
import { AiExecutionResultDto } from './dto/ai-execution.dto';
import { PromptDto } from './dto/prompt.dto';
import { AI_PROVIDER, AiProvider, AiProviderInfo } from './providers/ai-provider.interface';

/**
 * Sprint 18 - replaces the Sprint 17 deterministic mock with a real call
 * through the injected AiProvider (bound to GeminiProviderService in
 * AiOrchestratorModule as of Sprint 24; see ai-provider.interface.ts). This
 * is the only class in the orchestration chain that holds an AiProvider
 * dependency - AIOrchestratorService depends on this service, never on
 * AiProvider or Gemini directly.
 */
@Injectable()
export class AiExecutionService {
  constructor(@Inject(AI_PROVIDER) private readonly aiProvider: AiProvider) {}

  async execute(prompt: PromptDto): Promise<AiExecutionResultDto> {
    const result = await this.aiProvider.generate({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
    });

    return {
      response: result.reply,
      promptTokens: result.inputTokens,
      completionTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      model: result.model,
      provider: result.provider,
      latencyMs: result.latencyMs,
      finishReason: result.finishReason,
    };
  }

  /** Cheap descriptor (no network call) - used by AIOrchestratorService to label a failed execution with the provider that was attempted. */
  getProviderInfo(): AiProviderInfo {
    return this.aiProvider.getInfo();
  }
}

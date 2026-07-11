import { Injectable } from '@nestjs/common';
import { AiProviderResponse } from '../ai/providers/ai-provider.interface';
import { ClaudeResponse } from './interfaces/claude-response.interface';

const PROVIDER_NAME = 'anthropic';
const DEFAULT_FINISH_REASON = 'end_turn';

/**
 * Extracts the provider-agnostic AiProviderResponse shape out of Anthropic's
 * wire response - the one place that reads `content`/`usage`/`stop_reason`,
 * so ClaudeProviderService never has to know the Messages API's response
 * shape directly.
 */
@Injectable()
export class ClaudeResponseMapper {
  toReply(response: ClaudeResponse): string {
    return response.content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('\n');
  }

  toProviderResponse(response: ClaudeResponse, latencyMs: number): AiProviderResponse {
    return {
      reply: this.toReply(response),
      model: response.model,
      provider: PROVIDER_NAME,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      finishReason: response.stop_reason ?? DEFAULT_FINISH_REASON,
      latencyMs,
    };
  }
}

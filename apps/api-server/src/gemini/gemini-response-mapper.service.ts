import { Injectable } from '@nestjs/common';
import { AiProviderResponse } from '../ai/providers/ai-provider.interface';
import { GeminiResponse } from './interfaces/gemini-response.interface';

const PROVIDER_NAME = 'gemini';
const DEFAULT_FINISH_REASON = 'STOP';

/**
 * Extracts the provider-agnostic AiProviderResponse shape out of Gemini's
 * wire response - the one place that reads `candidates`/`usageMetadata`/
 * `finishReason`, so GeminiProviderService never has to know the
 * generateContent response shape directly.
 */
@Injectable()
export class GeminiResponseMapperService {
  toReply(response: GeminiResponse): string {
    return (response.candidates ?? [])
      .flatMap((candidate) => candidate.content?.parts ?? [])
      .filter((part) => part.text)
      .map((part) => part.text)
      .join('\n');
  }

  toProviderResponse(response: GeminiResponse, latencyMs: number, fallbackModel: string): AiProviderResponse {
    return {
      reply: this.toReply(response),
      model: response.modelVersion ?? fallbackModel,
      provider: PROVIDER_NAME,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      finishReason: response.candidates?.[0]?.finishReason ?? DEFAULT_FINISH_REASON,
      latencyMs,
    };
  }
}

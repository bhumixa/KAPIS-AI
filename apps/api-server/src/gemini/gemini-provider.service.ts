import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import {
  AiProvider,
  AiProviderHealth,
  AiProviderInfo,
  AiProviderRequest,
  AiProviderResponse,
} from '../ai/providers/ai-provider.interface';
import { GeminiApiError } from './gemini-error.util';
import { GeminiHealthService } from './gemini-health.service';
import { GeminiHttpService } from './gemini-http.service';
import { AI_INTENT_RESPONSE_SCHEMA } from './gemini-intent-response.schema';
import { GeminiResponseMapperService } from './gemini-response-mapper.service';

const PROVIDER_NAME = 'gemini';

/**
 * The current AiProvider implementation (Sprint 24) - real HTTPS calls to
 * Google's Gemini API, no streaming, no tool use, single-turn only. Uses
 * PromptBuilderService's output directly: `request.systemPrompt`/
 * `request.userPrompt` are sent as-is, never modified here. A future OpenAI/
 * Azure/Ollama provider is a sibling class implementing this same AiProvider
 * interface, rebound in AiOrchestratorModule - nothing in ai/ changes.
 */
@Injectable()
export class GeminiProviderService implements AiProvider {
  private readonly geminiConfig: AppConfig['gemini'];

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiHttpService: GeminiHttpService,
    private readonly responseMapper: GeminiResponseMapperService,
    private readonly geminiHealthService: GeminiHealthService,
  ) {
    this.geminiConfig = this.configService.get<AppConfig['gemini']>('app.gemini')!;
  }

  getInfo(): AiProviderInfo {
    return { provider: PROVIDER_NAME, model: this.geminiConfig.model };
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    if (!this.geminiConfig.apiKey) {
      throw new GeminiApiError(
        'GEMINI_API_KEY is not configured - set it in .env to enable AI generation.',
        null,
        'configuration_error',
        false,
      );
    }

    const startedAt = Date.now();
    const response = await this.geminiHttpService.generateContent({
      contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
      systemInstruction: request.systemPrompt
        ? { parts: [{ text: request.systemPrompt }] }
        : undefined,
      generationConfig: {
        maxOutputTokens: this.geminiConfig.maxOutputTokens,
        temperature: this.geminiConfig.temperature,
        // Sprint 25 - structured output (see prompt-builder.service.ts's
        // JSON_OUTPUT_INSTRUCTION for the matching system-prompt half of
        // this contract). GeminiResponseMapperService parses+validates the
        // result defensively regardless - this only makes a well-formed
        // response more likely, not guaranteed.
        responseMimeType: 'application/json',
        responseSchema: AI_INTENT_RESPONSE_SCHEMA,
        // gemini-flash-latest resolves to a "thinking" model that otherwise
        // spends part of maxOutputTokens on an internal reasoning pass before
        // emitting the JSON body - observed truncating the structured reply
        // (MAX_TOKENS) on longer answers. This is a short classify+reply
        // task with no need for extended thinking, so it's disabled outright.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const latencyMs = Date.now() - startedAt;

    return this.responseMapper.toProviderResponse(response, latencyMs, this.geminiConfig.model);
  }

  checkHealth(): Promise<AiProviderHealth> {
    return this.geminiHealthService.checkHealth();
  }
}

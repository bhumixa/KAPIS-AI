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
import { ClaudeApiError } from './claude-error.util';
import { ClaudeHealthService } from './claude-health.service';
import { ClaudeHttpService } from './claude-http.service';
import { ClaudeResponseMapper } from './claude-response-mapper.service';

const PROVIDER_NAME = 'anthropic';

/**
 * The current AiProvider implementation (Sprint 18) - real HTTPS calls to
 * Anthropic's Messages API, no streaming, no tool use, single-turn only, per
 * the brief. Uses PromptBuilderService's output directly: `request.systemPrompt`/
 * `request.userPrompt` are sent as-is, never modified here. A future OpenAI/
 * Gemini/Azure/Ollama provider is a sibling class implementing this same
 * AiProvider interface, rebound in AiOrchestratorModule - nothing in ai/
 * changes.
 */
@Injectable()
export class ClaudeProviderService implements AiProvider {
  private readonly anthropicConfig: AppConfig['anthropic'];

  constructor(
    private readonly configService: ConfigService,
    private readonly claudeHttpService: ClaudeHttpService,
    private readonly responseMapper: ClaudeResponseMapper,
    private readonly claudeHealthService: ClaudeHealthService,
  ) {
    this.anthropicConfig = this.configService.get<AppConfig['anthropic']>('app.anthropic')!;
  }

  getInfo(): AiProviderInfo {
    return { provider: PROVIDER_NAME, model: this.anthropicConfig.model };
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    if (!this.anthropicConfig.apiKey) {
      throw new ClaudeApiError(
        'ANTHROPIC_API_KEY is not configured - set it in .env to enable AI generation.',
        null,
        'configuration_error',
        false,
      );
    }

    const startedAt = Date.now();
    const response = await this.claudeHttpService.postMessages({
      model: this.anthropicConfig.model,
      max_tokens: this.anthropicConfig.maxTokens,
      temperature: this.anthropicConfig.temperature,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
    });
    const latencyMs = Date.now() - startedAt;

    return this.responseMapper.toProviderResponse(response, latencyMs);
  }

  checkHealth(): Promise<AiProviderHealth> {
    return this.claudeHealthService.checkHealth();
  }
}

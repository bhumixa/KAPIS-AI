import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { AiProviderHealth } from '../ai/providers/ai-provider.interface';
import { ClaudeHttpService } from './claude-http.service';

const PROVIDER_NAME = 'anthropic';

/**
 * Backs GET /api/ai/provider/health - configured (API key present) and
 * reachable (a real GET /v1/models call succeeded) are reported separately,
 * same distinction N8nService.checkHealth() draws for the n8n bridge.
 * `reachable` is only probed when `configured` is true - an unset API key
 * skips the network round trip outright.
 */
@Injectable()
export class ClaudeHealthService {
  private readonly anthropicConfig: AppConfig['anthropic'];

  constructor(
    private readonly configService: ConfigService,
    private readonly claudeHttpService: ClaudeHttpService,
  ) {
    this.anthropicConfig = this.configService.get<AppConfig['anthropic']>('app.anthropic')!;
  }

  async checkHealth(): Promise<AiProviderHealth> {
    const configured = this.anthropicConfig.apiKey.length > 0;
    const reachable = configured && (await this.claudeHttpService.ping());
    return {
      configured,
      reachable,
      model: this.anthropicConfig.model,
      provider: PROVIDER_NAME,
    };
  }
}

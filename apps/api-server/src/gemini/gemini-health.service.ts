import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { AiProviderHealth } from '../ai/providers/ai-provider.interface';
import { GeminiHttpService } from './gemini-http.service';

const PROVIDER_NAME = 'gemini';

/**
 * Backs GET /api/ai/provider/health - configured (API key present) and
 * reachable (a real GET /v1beta/models call succeeded) are reported
 * separately, same distinction N8nService.checkHealth() draws for the n8n
 * bridge. `reachable` is only probed when `configured` is true - an unset
 * API key skips the network round trip outright.
 */
@Injectable()
export class GeminiHealthService {
  private readonly geminiConfig: AppConfig['gemini'];

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiHttpService: GeminiHttpService,
  ) {
    this.geminiConfig = this.configService.get<AppConfig['gemini']>('app.gemini')!;
  }

  async checkHealth(): Promise<AiProviderHealth> {
    const configured = this.geminiConfig.apiKey.length > 0;
    const reachable = configured && (await this.geminiHttpService.ping());
    return {
      configured,
      reachable,
      model: this.geminiConfig.model,
      provider: PROVIDER_NAME,
    };
  }
}

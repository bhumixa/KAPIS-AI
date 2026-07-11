import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { describeClaudeError } from './claude-error.util';
import { ClaudeMessagesRequest } from './interfaces/claude-message.interface';
import { ClaudeResponse } from './interfaces/claude-response.interface';

const ANTHROPIC_VERSION = '2023-06-01';

/**
 * The one place that makes an HTTPS call to Anthropic - a thin wrapper over
 * HttpService, mirroring N8nService's own httpService.post()/get() shape.
 * Never called directly outside ClaudeProviderService/ClaudeHealthService;
 * every failure is normalized to a ClaudeApiError by describeClaudeError()
 * (never leaks the request headers, which carry ANTHROPIC_API_KEY).
 */
@Injectable()
export class ClaudeHttpService {
  private readonly anthropicConfig: AppConfig['anthropic'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.anthropicConfig = this.configService.get<AppConfig['anthropic']>('app.anthropic')!;
  }

  async postMessages(body: ClaudeMessagesRequest): Promise<ClaudeResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ClaudeResponse>(`${this.anthropicConfig.apiUrl}/v1/messages`, body, {
          headers: this.headers(),
          timeout: this.anthropicConfig.httpTimeoutMs,
        }),
      );
      return response.data;
    } catch (error) {
      throw describeClaudeError(error);
    }
  }

  /** GET /v1/models - a free, zero-token-cost reachability probe (see the Models API docs). */
  async ping(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.anthropicConfig.apiUrl}/v1/models`, {
          headers: this.headers(),
          timeout: this.anthropicConfig.httpTimeoutMs,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.anthropicConfig.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
  }
}

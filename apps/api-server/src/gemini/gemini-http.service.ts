import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { describeGeminiError } from './gemini-error.util';
import { GeminiGenerateContentRequest } from './interfaces/gemini-message.interface';
import { GeminiResponse } from './interfaces/gemini-response.interface';

/**
 * The one place that makes an HTTPS call to Google's Gemini API - a thin
 * wrapper over HttpService, mirroring N8nService's own httpService.post()/
 * get() shape. Never called directly outside GeminiProviderService/
 * GeminiHealthService; every failure is normalized to a GeminiApiError by
 * describeGeminiError() (never leaks the request headers, which carry
 * GEMINI_API_KEY).
 */
@Injectable()
export class GeminiHttpService {
  private readonly geminiConfig: AppConfig['gemini'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.geminiConfig = this.configService.get<AppConfig['gemini']>('app.gemini')!;
  }

  async generateContent(body: GeminiGenerateContentRequest): Promise<GeminiResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GeminiResponse>(
          `${this.geminiConfig.apiUrl}/v1beta/models/${this.geminiConfig.model}:generateContent`,
          body,
          { headers: this.headers(), timeout: this.geminiConfig.httpTimeoutMs },
        ),
      );
      return response.data;
    } catch (error) {
      throw describeGeminiError(error);
    }
  }

  /** GET /v1beta/models - a free, zero-token-cost reachability probe. */
  async ping(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.geminiConfig.apiUrl}/v1beta/models`, {
          headers: this.headers(),
          timeout: this.geminiConfig.httpTimeoutMs,
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
      'x-goog-api-key': this.geminiConfig.apiKey,
    };
  }
}

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { describeWhatsappError } from './whatsapp-error.util';

interface SendMessageResponse {
  messages: { id: string }[];
}

interface PhoneNumberDetailsResponse {
  display_phone_number: string;
  verified_name: string;
}

/**
 * The one place that makes an HTTPS call to Meta's Graph API - a thin
 * wrapper over HttpService, mirroring ClaudeHttpService's own shape
 * (apps/api-server/src/claude/claude-http.service.ts). Never called
 * directly outside WhatsappService/PhoneNumberService; every failure is
 * normalized to a WhatsappApiError by describeWhatsappError() (never leaks
 * the request headers, which carry WHATSAPP_ACCESS_TOKEN).
 */
@Injectable()
export class WhatsappHttpService {
  private readonly whatsappConfig: AppConfig['whatsapp'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.whatsappConfig = this.configService.get<AppConfig['whatsapp']>('app.whatsapp')!;
  }

  /** POST /{phone-number-id}/messages - sends any message type; `payload` is the type-specific Graph API body (text/template/image/document). */
  async sendMessage(payload: Record<string, unknown>): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<SendMessageResponse>(
          `${this.whatsappConfig.apiUrl}/${this.whatsappConfig.phoneNumberId}/messages`,
          { messaging_product: 'whatsapp', ...payload },
          { headers: this.headers(), timeout: this.whatsappConfig.httpTimeoutMs },
        ),
      );
      return response.data.messages[0].id;
    } catch (error) {
      throw describeWhatsappError(error);
    }
  }

  /** GET /{phone-number-id} - business account/display number, doubles as the health reachability probe. */
  async getPhoneNumberDetails(): Promise<PhoneNumberDetailsResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<PhoneNumberDetailsResponse>(
          `${this.whatsappConfig.apiUrl}/${this.whatsappConfig.phoneNumberId}`,
          {
            params: { fields: 'display_phone_number,verified_name' },
            headers: this.headers(),
            timeout: this.whatsappConfig.httpTimeoutMs,
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw describeWhatsappError(error);
    }
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.whatsappConfig.accessToken}`,
    };
  }
}

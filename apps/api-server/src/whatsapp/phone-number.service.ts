import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { WhatsappHealthDto } from './dto/whatsapp-health.dto';
import { WhatsappHttpService } from './whatsapp-http.service';
import { WhatsappRepository } from './whatsapp.repository';

/**
 * Backs GET /api/whatsapp/health - configured (phone number id + access
 * token present) and connected (a real GET /{phone-number-id} call
 * succeeded) are reported as one combined `connected` flag, plus the
 * business account's own display name/number and the most recent
 * webhook/outgoing timestamps this module has persisted. Mirrors
 * ClaudeHealthService's configured/reachable split
 * (apps/api-server/src/claude/claude-health.service.ts), condensed to one
 * field since the Sprint 20 brief's health shape has no separate
 * "configured" field to fill.
 */
@Injectable()
export class PhoneNumberService {
  private readonly logger = new Logger(PhoneNumberService.name);
  private readonly whatsappConfig: AppConfig['whatsapp'];

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappHttpService: WhatsappHttpService,
    private readonly whatsappRepository: WhatsappRepository,
  ) {
    this.whatsappConfig = this.configService.get<AppConfig['whatsapp']>('app.whatsapp')!;
  }

  async getHealth(): Promise<WhatsappHealthDto> {
    const configured =
      this.whatsappConfig.phoneNumberId.length > 0 && this.whatsappConfig.accessToken.length > 0;

    let connected = false;
    let phoneNumber = '';
    let businessAccount = '';

    if (configured) {
      try {
        const details = await this.whatsappHttpService.getPhoneNumberDetails();
        connected = true;
        phoneNumber = details.display_phone_number;
        businessAccount = details.verified_name;
      } catch (error) {
        this.logger.warn(`WhatsApp phone number lookup failed: ${(error as Error).message}`);
      }
    }

    const [lastEvent, lastOutgoing] = await Promise.all([
      this.whatsappRepository.findLastEvent(),
      this.whatsappRepository.findLastOutgoingMessage(),
    ]);

    return {
      connected,
      phoneNumber,
      businessAccount,
      lastWebhook: lastEvent ? lastEvent.receivedAt.toISOString() : null,
      lastOutgoing: lastOutgoing ? lastOutgoing.createdAt.toISOString() : null,
    };
  }
}

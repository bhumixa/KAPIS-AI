import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MessageDto } from '../conversations/dto/message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { WhatsappHealthDto } from './dto/whatsapp-health.dto';
import { PhoneNumberService } from './phone-number.service';
import { WebhookService } from './webhook.service';
import { WhatsappService } from './whatsapp.service';

// @Public() on every route, same escape hatch every other business
// controller uses (see docs/DevelopmentGuide.md) - the webhook routes are
// additionally protected by Meta's own verify-token handshake (GET) and are
// meant to be called by Meta, not a logged-in user, regardless.
@Public()
@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly webhookService: WebhookService,
    private readonly phoneNumberService: PhoneNumberService,
  ) {}

  @Get('webhook')
  @ApiOperation({
    summary:
      "Meta's webhook subscription handshake - echoes hub.challenge back only when hub.verify_token matches WHATSAPP_VERIFY_TOKEN",
  })
  verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ): string {
    return this.webhookService.verify(mode, token, challenge);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Receives every WhatsApp Cloud API event (messages, delivery/read status, media metadata) and persists it. ' +
      'No AI, no n8n, no automation - communication layer only.',
  })
  async receiveWebhook(@Body() event: WebhookEventDto): Promise<{ received: true }> {
    await this.webhookService.handleEvent(event);
    return { received: true };
  }

  @Post('send')
  @ApiOperation({
    summary:
      'Sends a text, template, image (metadata/link), or document (metadata/link) message via the WhatsApp Cloud API ' +
      'and appends it to the conversation timeline (Sprint 16 MessageService, reused). No AI-generated content.',
  })
  sendMessage(@Body() dto: SendMessageDto): Promise<MessageDto> {
    return this.whatsappService.sendMessage(dto);
  }

  @Get('health')
  @ApiOperation({
    summary:
      "The WhatsApp Cloud API connection's health - configured/reachable state, business account, last webhook/outgoing timestamps",
  })
  getHealth(): Promise<WhatsappHealthDto> {
    return this.phoneNumberService.getHealth();
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { ConversationService } from '../conversations/conversation.service';
import { MessageDto } from '../conversations/dto/message.dto';
import { MessageService } from '../conversations/message.service';
import { PatientsService } from '../patients/patients.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MediaService } from './media.service';
import { WhatsappApiError } from './whatsapp-error.util';
import { WhatsappHttpService } from './whatsapp-http.service';
import { WhatsappRepository } from './whatsapp.repository';

/**
 * The one outbound entry point (POST /api/whatsapp/send) - resolves the
 * recipient from the conversation (via ConversationService/PatientsService,
 * never a raw phone number the caller supplies), calls the real Graph API,
 * then persists both the WhatsApp-specific record (WhatsappRepository) and
 * the channel-agnostic conversation timeline entry (MessageService, reused
 * from Sprint 16 - never duplicated). Returns the MessageDto MessageService
 * produced, the same shape apps/clinic-admin's MessageService already
 * expects from the endpoint it used to call directly
 * (POST /conversations/:id/messages) - so the Angular-side change is only
 * which URL/payload is sent, not how the response is handled.
 */
@Injectable()
export class WhatsappService {
  private readonly whatsappConfig: AppConfig['whatsapp'];

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappHttpService: WhatsappHttpService,
    private readonly whatsappRepository: WhatsappRepository,
    private readonly mediaService: MediaService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly patientsService: PatientsService,
  ) {
    this.whatsappConfig = this.configService.get<AppConfig['whatsapp']>('app.whatsapp')!;
  }

  async sendMessage(dto: SendMessageDto): Promise<MessageDto> {
    if (!this.whatsappConfig.accessToken || !this.whatsappConfig.phoneNumberId) {
      throw new WhatsappApiError(
        'WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID is not configured - set them in .env to enable sending.',
        null,
        'configuration_error',
        false,
      );
    }

    const conversation = await this.conversationService.getOrThrow(dto.conversationId);
    const patient = await this.patientsService.findOne(conversation.patientId);
    if (!patient.whatsappNumber) {
      throw new BadRequestException(`Patient "${patient.id}" has no WhatsApp number on file.`);
    }

    const waMessageId = await this.whatsappHttpService.sendMessage(
      this.buildGraphPayload(dto, patient.whatsappNumber),
    );

    const timelineBody = this.buildTimelineBody(dto);
    const created = await this.messageService.create(dto.conversationId, {
      direction: 'outgoing',
      sender: dto.sender ?? 'staff',
      senderName: dto.senderName ?? 'Staff',
      body: timelineBody,
    });

    const whatsappMessage = await this.whatsappRepository.createMessage({
      waMessageId,
      direction: 'outgoing',
      messageType: dto.type,
      fromNumber: this.whatsappConfig.phoneNumberId,
      toNumber: patient.whatsappNumber,
      body: timelineBody,
      payload: this.buildPayloadRecord(dto),
      status: 'sent',
      conversationId: dto.conversationId,
      messageId: created.id,
    });

    if ((dto.type === 'image' || dto.type === 'document') && dto.media) {
      await this.mediaService.persistOutgoing(
        whatsappMessage.id,
        dto.type,
        dto.media.link,
        dto.media.caption,
        dto.media.filename,
      );
    }

    return created;
  }

  private buildGraphPayload(dto: SendMessageDto, to: string): Record<string, unknown> {
    switch (dto.type) {
      case 'text':
        return { to, type: 'text', text: { body: dto.body } };
      case 'template':
        return {
          to,
          type: 'template',
          template: {
            name: dto.templateName,
            language: { code: dto.templateLanguage ?? 'en_US' },
            ...(dto.templateParameters?.length
              ? {
                  components: [
                    {
                      type: 'body',
                      parameters: dto.templateParameters.map((text) => ({ type: 'text', text })),
                    },
                  ],
                }
              : {}),
          },
        };
      case 'image':
        return { to, type: 'image', image: { link: dto.media!.link, caption: dto.media!.caption } };
      case 'document':
        return {
          to,
          type: 'document',
          document: {
            link: dto.media!.link,
            caption: dto.media!.caption,
            filename: dto.media!.filename,
          },
        };
    }
  }

  private buildTimelineBody(dto: SendMessageDto): string {
    switch (dto.type) {
      case 'text':
        return dto.body ?? '';
      case 'template':
        return `[template: ${dto.templateName}]`;
      case 'image':
        return dto.media?.caption ?? '[image]';
      case 'document':
        return dto.media?.caption ?? dto.media?.filename ?? '[document]';
    }
  }

  private buildPayloadRecord(dto: SendMessageDto): object {
    switch (dto.type) {
      case 'text':
        return {};
      case 'template':
        return {
          templateName: dto.templateName,
          templateLanguage: dto.templateLanguage ?? 'en_US',
          templateParameters: dto.templateParameters ?? [],
        };
      case 'image':
      case 'document':
        return { link: dto.media?.link, caption: dto.media?.caption, filename: dto.media?.filename };
    }
  }
}

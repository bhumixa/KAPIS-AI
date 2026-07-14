import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowEventsService } from '../common/events/workflow-events.service';
import { AppConfig } from '../config/configuration';
import { ConversationService } from '../conversations/conversation.service';
import { MessageService } from '../conversations/message.service';
import { InquiriesService } from '../inquiries/inquiries.service';
import { PatientsService } from '../patients/patients.service';
import { WhatsappMediaType } from './dto/media-message.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { IncomingMediaPayload, MediaService } from './media.service';
import { WhatsappRepository } from './whatsapp.repository';

const MEDIA_MESSAGE_TYPES: WhatsappMediaType[] = ['image', 'document'];

interface WebhookIncomingMessage {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
  image?: IncomingMediaPayload;
  document?: IncomingMediaPayload;
}

interface WebhookStatus {
  id: string;
  status: string;
}

// Sprint 25 - Meta's webhook payload includes the sender's WhatsApp profile
// name here; previously silently dropped since nothing typed/read it (a
// known patient's name always came from clinic.patients instead). Now the
// only name source available for a first-time sender (Inquiry.displayName).
interface WebhookContactProfile {
  name?: string;
}

interface WebhookContact {
  profile?: WebhookContactProfile;
  wa_id?: string;
}

interface WebhookChangeValue {
  metadata?: { display_phone_number?: string };
  messages?: WebhookIncomingMessage[];
  statuses?: WebhookStatus[];
  contacts?: WebhookContact[];
  // Not part of the public Cloud API schema today - see this module's own
  // 040_create_whatsapp_events.sql header comment on why this is checked
  // defensively rather than assumed to exist.
  typing_indicators?: unknown[];
}

/**
 * Handles both routes the Sprint 20 brief names for the webhook: GET (Meta's
 * one-time subscription handshake) and POST (every real event afterward).
 * POST is the only place this module writes to clinic.conversations/messages
 * (Sprint 16) - reused via ConversationService/MessageService exactly as the
 * brief requires ("Reuse Sprint 16. Do not duplicate conversation logic."),
 * never re-implemented here. Still no AI, no n8n - an incoming message is
 * persisted, full stop (see WhatsappModule's doc comment). Sprint 21 adds one
 * additive line: once a message is linked to a conversation, it announces
 * that fact on WorkflowEventsService (common/events) so workflow-runtime can
 * pick the pipeline up asynchronously. This module still never imports
 * workflow-runtime and has no idea what (if anything) listens.
 *
 * Sprint 25: a message from a number with no matching patient no longer
 * dead-ends here - it creates/resolves an Inquiry (InquiriesService) and a
 * Conversation for it instead, so the same downstream pipeline (AI, decision,
 * reply) runs for a first-time sender too. Still no AI/n8n call here - the
 * only new behavior is which owner (Patient vs Inquiry) the Conversation gets.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly whatsappConfig: AppConfig['whatsapp'];

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappRepository: WhatsappRepository,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly patientsService: PatientsService,
    private readonly inquiriesService: InquiriesService,
    private readonly mediaService: MediaService,
    private readonly workflowEvents: WorkflowEventsService,
  ) {
    this.whatsappConfig = this.configService.get<AppConfig['whatsapp']>('app.whatsapp')!;
  }

  /** GET /api/whatsapp/webhook - Meta's one-time subscription handshake; returns the challenge only when the verify token matches. */
  verify(mode: string | undefined, token: string | undefined, challenge: string | undefined): string {
    if (mode !== 'subscribe' || !token || token !== this.whatsappConfig.verifyToken || !challenge) {
      throw new ForbiddenException('WhatsApp webhook verification failed.');
    }
    return challenge;
  }

  /** POST /api/whatsapp/webhook - persists every entry/change Meta sends; never throws (Meta retries on any non-2xx). */
  async handleEvent(event: WebhookEventDto): Promise<void> {
    for (const entry of event.entry) {
      const changes = (entry.changes as { value?: WebhookChangeValue }[] | undefined) ?? [];
      for (const change of changes) {
        const value = change.value ?? {};
        await this.handleStatuses(value.statuses ?? []);
        await this.handleMessages(
          value.messages ?? [],
          value.metadata?.display_phone_number ?? '',
          value.contacts ?? [],
        );
        await this.handleTypingIndicators(value.typing_indicators ?? []);
      }
    }
  }

  private async handleStatuses(statuses: WebhookStatus[]): Promise<void> {
    for (const status of statuses) {
      await this.whatsappRepository.createEvent({
        eventType: 'status',
        waMessageId: status.id,
        status: status.status,
        payload: status as unknown as object,
      });

      const message = await this.whatsappRepository.findByWaMessageId(status.id);
      if (message) {
        await this.whatsappRepository.updateStatus(message.id, status.status);
      }
    }
  }

  private async handleMessages(
    messages: WebhookIncomingMessage[],
    toNumber: string,
    contacts: WebhookContact[],
  ): Promise<void> {
    for (const message of messages) {
      await this.whatsappRepository.createEvent({
        eventType: 'message',
        waMessageId: message.id,
        status: '',
        payload: message as unknown as object,
      });

      const patient = await this.patientsService.findByWhatsappNumber(message.from);
      if (!patient) {
        await this.handleUnknownSender(message, toNumber, contacts);
        continue;
      }

      const conversationId = await this.resolveConversation(patient.id);
      const body = this.extractBody(message);
      const created = await this.messageService.create(conversationId, {
        direction: 'incoming',
        sender: 'patient',
        senderName: `${patient.firstName} ${patient.lastName}`,
        body,
      });

      const whatsappMessage = await this.persistIncomingWhatsappMessage(
        message,
        toNumber,
        conversationId,
        created.id,
      );

      if (this.isMediaType(message.type)) {
        const media = message.type === 'image' ? message.image : message.document;
        if (media) {
          await this.mediaService.persistIncoming(whatsappMessage.id, message.type as WhatsappMediaType, media);
        }
      }

      this.workflowEvents.emitWhatsappIncomingMessage({
        conversationId,
        messageId: created.id,
        patientId: patient.id,
        inquiryId: null,
        whatsappMessageId: whatsappMessage.id,
      });
    }
  }

  // Sprint 25 - the Inquiry-owned counterpart of the found-branch above,
  // mirroring it step for step (same messageService.create()/
  // persistIncomingWhatsappMessage()/media handling/event emit) so a
  // first-time sender gets the identical downstream AI pipeline a known
  // patient does, just linked to an Inquiry instead of a Patient.
  private async handleUnknownSender(
    message: WebhookIncomingMessage,
    toNumber: string,
    contacts: WebhookContact[],
  ): Promise<void> {
    const displayName = contacts.find((contact) => contact.wa_id === message.from)?.profile?.name ?? '';
    const inquiry = await this.inquiriesService.resolveForWhatsappNumber(message.from, displayName);
    const conversationId = await this.resolveInquiryConversation(inquiry.id);

    const body = this.extractBody(message);
    const created = await this.messageService.create(conversationId, {
      direction: 'incoming',
      sender: 'patient',
      senderName: displayName || 'Unknown',
      body,
    });

    const whatsappMessage = await this.persistIncomingWhatsappMessage(
      message,
      toNumber,
      conversationId,
      created.id,
    );

    if (this.isMediaType(message.type)) {
      const media = message.type === 'image' ? message.image : message.document;
      if (media) {
        await this.mediaService.persistIncoming(whatsappMessage.id, message.type as WhatsappMediaType, media);
      }
    }

    this.workflowEvents.emitWhatsappIncomingMessage({
      conversationId,
      messageId: created.id,
      patientId: null,
      inquiryId: inquiry.id,
      whatsappMessageId: whatsappMessage.id,
    });
  }

  private async handleTypingIndicators(typingIndicators: unknown[]): Promise<void> {
    for (const indicator of typingIndicators) {
      await this.whatsappRepository.createEvent({
        eventType: 'typing',
        waMessageId: '',
        status: '',
        payload: indicator as object,
      });
    }
  }

  // Reuses ConversationService in full (findAll/create) rather than querying
  // clinic.conversations directly - the "do not duplicate conversation
  // logic" reuse the brief asks for. Prefers an already-open conversation
  // for this patient over always creating a new one, mirroring how a human
  // receptionist would keep replying in the same thread.
  private async resolveConversation(patientId: string): Promise<string> {
    const existing = await this.conversationService.findAll({ patientId });
    const open = existing.find((conversation) => conversation.status === 'open') ?? existing[0];
    if (open) {
      return open.id;
    }
    const created = await this.conversationService.create({ patientId, channel: 'whatsapp' });
    return created.id;
  }

  // Sprint 25 - the Inquiry-owned counterpart of resolveConversation() above,
  // same "prefer an already-open thread" behavior.
  private async resolveInquiryConversation(inquiryId: string): Promise<string> {
    const existing = await this.conversationService.findAll({ inquiryId });
    const open = existing.find((conversation) => conversation.status === 'open') ?? existing[0];
    if (open) {
      return open.id;
    }
    const created = await this.conversationService.createForInquiry(inquiryId, 'whatsapp');
    return created.id;
  }

  private async persistIncomingWhatsappMessage(
    message: WebhookIncomingMessage,
    toNumber: string,
    conversationId: string | null,
    messageId: string | null,
  ) {
    return this.whatsappRepository.createMessage({
      waMessageId: message.id,
      direction: 'incoming',
      messageType: this.isMediaType(message.type) ? message.type : 'text',
      fromNumber: message.from,
      toNumber,
      body: this.extractBody(message),
      status: 'received',
      ...(conversationId ? { conversationId } : {}),
      ...(messageId ? { messageId } : {}),
    });
  }

  private extractBody(message: WebhookIncomingMessage): string {
    if (message.type === 'text') {
      return message.text?.body ?? '';
    }
    if (message.type === 'image') {
      return message.image?.caption ?? '[image]';
    }
    if (message.type === 'document') {
      return message.document?.caption ?? message.document?.filename ?? '[document]';
    }
    return '';
  }

  private isMediaType(type: string): type is WhatsappMediaType {
    return (MEDIA_MESSAGE_TYPES as string[]).includes(type);
  }
}

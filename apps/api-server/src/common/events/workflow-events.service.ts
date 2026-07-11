import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

/** Emitted by WebhookService once an incoming WhatsApp message is persisted and linked to a conversation. */
export interface WhatsappIncomingMessageEvent {
  conversationId: string;
  messageId: string;
  patientId: string;
  whatsappMessageId: string;
}

export const WHATSAPP_INCOMING_MESSAGE_EVENT = 'whatsapp.incoming-message';

/**
 * Sprint 21 integration point: a tiny process-local pub/sub so
 * WhatsappModule (Sprint 20) can announce "a message just landed in a
 * conversation" without importing WorkflowRuntimeModule, and
 * WorkflowRuntimeModule can react without WhatsappModule ever depending on
 * it - avoids a circular module import between the two while still letting
 * the pipeline kick off automatically. Global so any module can inject it
 * without adding CommonEventsModule to its own `imports`.
 */
@Injectable()
export class WorkflowEventsService extends EventEmitter {
  emitWhatsappIncomingMessage(payload: WhatsappIncomingMessageEvent): void {
    this.emit(WHATSAPP_INCOMING_MESSAGE_EVENT, payload);
  }

  onWhatsappIncomingMessage(listener: (payload: WhatsappIncomingMessageEvent) => void): void {
    this.on(WHATSAPP_INCOMING_MESSAGE_EVENT, listener);
  }
}

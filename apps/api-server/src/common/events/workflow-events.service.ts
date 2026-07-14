import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

/**
 * Emitted by WebhookService once an incoming WhatsApp message is persisted
 * and linked to a conversation. Sprint 25: patientId is nullable and
 * inquiryId added - exactly one of the two is set, mirroring
 * clinic.conversations' patientId/inquiryId split (a first-time sender's
 * message is linked to an Inquiry, not a Patient, until a booking converts it).
 */
export interface WhatsappIncomingMessageEvent {
  conversationId: string;
  messageId: string;
  patientId: string | null;
  inquiryId: string | null;
  whatsappMessageId: string;
}

export const WHATSAPP_INCOMING_MESSAGE_EVENT = 'whatsapp.incoming-message';

/** Emitted by AppointmentsService.create()/update()/remove() - payload carries only the id, same "announce and let the listener call back in" shape WhatsappIncomingMessageEvent uses. */
export interface AppointmentLifecycleEvent {
  appointmentId: string;
}

export const APPOINTMENT_CREATED_EVENT = 'appointment.created';
export const APPOINTMENT_UPDATED_EVENT = 'appointment.updated';
export const APPOINTMENT_CANCELLED_EVENT = 'appointment.cancelled';

/**
 * Sprint 21 integration point: a tiny process-local pub/sub so
 * WhatsappModule (Sprint 20) can announce "a message just landed in a
 * conversation" without importing WorkflowRuntimeModule, and
 * WorkflowRuntimeModule can react without WhatsappModule ever depending on
 * it - avoids a circular module import between the two while still letting
 * the pipeline kick off automatically. Global so any module can inject it
 * without adding CommonEventsModule to its own `imports`.
 *
 * Sprint 22 reuses the exact same seam for AppointmentsModule ->
 * GoogleCalendarModule: AppointmentsService announces create/update/cancel,
 * GoogleCalendarModule's GoogleCalendarSyncService reacts by calling back
 * into AppointmentsService.findOne() for the canonical current state (see
 * that service's own doc comment) - AppointmentsModule still never imports
 * or knows about GoogleCalendarModule.
 */
@Injectable()
export class WorkflowEventsService extends EventEmitter {
  emitWhatsappIncomingMessage(payload: WhatsappIncomingMessageEvent): void {
    this.emit(WHATSAPP_INCOMING_MESSAGE_EVENT, payload);
  }

  onWhatsappIncomingMessage(listener: (payload: WhatsappIncomingMessageEvent) => void): void {
    this.on(WHATSAPP_INCOMING_MESSAGE_EVENT, listener);
  }

  emitAppointmentCreated(payload: AppointmentLifecycleEvent): void {
    this.emit(APPOINTMENT_CREATED_EVENT, payload);
  }

  onAppointmentCreated(listener: (payload: AppointmentLifecycleEvent) => void): void {
    this.on(APPOINTMENT_CREATED_EVENT, listener);
  }

  emitAppointmentUpdated(payload: AppointmentLifecycleEvent): void {
    this.emit(APPOINTMENT_UPDATED_EVENT, payload);
  }

  onAppointmentUpdated(listener: (payload: AppointmentLifecycleEvent) => void): void {
    this.on(APPOINTMENT_UPDATED_EVENT, listener);
  }

  emitAppointmentCancelled(payload: AppointmentLifecycleEvent): void {
    this.emit(APPOINTMENT_CANCELLED_EVENT, payload);
  }

  onAppointmentCancelled(listener: (payload: AppointmentLifecycleEvent) => void): void {
    this.on(APPOINTMENT_CANCELLED_EVENT, listener);
  }
}

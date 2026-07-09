export type WebhookStatus = 'active' | 'inactive';

export type WebhookEvent =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'patient.created'
  | 'message.received'
  | 'payment.completed';

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'appointment.created',
  'appointment.updated',
  'appointment.cancelled',
  'patient.created',
  'message.received',
  'payment.completed',
];

/** An outbound webhook subscription - fires (once a real dispatcher exists) when one of `events` occurs. */
export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  status: WebhookStatus;
  events: WebhookEvent[];
  createdAt: string;
  updatedAt: string;
}

export type WebhookInput = Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>;

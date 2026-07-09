export type MessageTemplateType =
  'appointment_confirmation' | 'reminder' | 'follow_up' | 'cancellation' | 'welcome' | 'thank_you';

export const MESSAGE_TEMPLATE_TYPES: MessageTemplateType[] = [
  'appointment_confirmation',
  'reminder',
  'follow_up',
  'cancellation',
  'welcome',
  'thank_you',
];

export const MESSAGE_TEMPLATE_TYPE_LABELS: Record<MessageTemplateType, string> = {
  appointment_confirmation: 'Appointment Confirmation',
  reminder: 'Reminder',
  follow_up: 'Follow-up',
  cancellation: 'Cancellation',
  welcome: 'Welcome',
  thank_you: 'Thank You',
};

/** A reusable WhatsApp/email message template. `variables` are merge-field names (e.g. "patientName") the future WhatsApp module will substitute at send time. */
export interface MessageTemplate {
  id: string;
  name: string;
  type: MessageTemplateType;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export type MessageTemplateInput = Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>;

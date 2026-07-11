export type PromptTemplateType =
  | 'greeting'
  | 'appointment_booking'
  | 'appointment_cancellation'
  | 'follow_up'
  | 'prescription_reminder'
  | 'general_question'
  | 'emergency_escalation';

export const PROMPT_TEMPLATE_TYPES: readonly PromptTemplateType[] = [
  'greeting',
  'appointment_booking',
  'appointment_cancellation',
  'follow_up',
  'prescription_reminder',
  'general_question',
  'emergency_escalation',
];

export const PROMPT_TEMPLATE_TYPE_LABELS: Record<PromptTemplateType, string> = {
  greeting: 'Greeting',
  appointment_booking: 'Appointment Booking',
  appointment_cancellation: 'Appointment Cancellation',
  follow_up: 'Follow-up',
  prescription_reminder: 'Prescription Reminder',
  general_question: 'General Question',
  emergency_escalation: 'Emergency Escalation',
};

/** Mirrors apps/api-server's PromptTemplateDto - see database/migrations/034_create_prompt_templates.sql. */
export interface PromptTemplate {
  id: string;
  name: string;
  type: PromptTemplateType;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Create/update payload - the server owns id and timestamps. */
export type PromptTemplateInput = Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>;

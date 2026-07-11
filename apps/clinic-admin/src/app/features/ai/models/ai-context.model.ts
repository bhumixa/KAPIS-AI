import { Appointment } from '../../appointments/models/appointment.model';
import { Conversation } from '../../conversations/models/conversation.model';
import { ConversationNote } from '../../conversations/models/conversation-note.model';
import { Message } from '../../conversations/models/message.model';
import { Doctor } from '../../doctors/models/doctor.model';
import { Patient } from '../../patients/models/patient.model';

export interface BusinessHoursDay {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
}

/** Mirrors apps/api-server's ClinicProfileContextDto. */
export interface ClinicProfileContext {
  clinicName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  timeZone: string;
  businessHours: BusinessHoursDay[];
}

export interface ServiceContext {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface FaqContext {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface PolicyContext {
  id: string;
  title: string;
  type: string;
  content: string;
}

export interface MessageTemplateContext {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

/** Mirrors apps/api-server's KnowledgeBaseContextDto. */
export interface KnowledgeBaseContext {
  faqs: FaqContext[];
  services: ServiceContext[];
  policies: PolicyContext[];
  messageTemplates: MessageTemplateContext[];
}

/** Mirrors apps/api-server's ConversationContextDto - the Sprint 16 Conversation Engine context. */
export interface ConversationContext {
  conversation: Conversation;
  patient: Patient;
  doctor: Doctor | null;
  upcomingAppointments: Appointment[];
  previousAppointments: Appointment[];
  clinicProfile: ClinicProfileContext | null;
  knowledgeBase: KnowledgeBaseContext;
}

export interface InsuranceProviderContext {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
}

export interface AiPromptSettingsContext {
  clinicPersonality: string;
  tone: string;
  greeting: string;
  fallbackMessage: string;
  emergencyInstructions: string;
  escalationRules: string;
  systemPrompt: string;
  enabled: boolean;
}

/**
 * Mirrors apps/api-server's AiConversationContextDto - the AI Orchestration
 * Engine's (Sprint 17) complete context object: Sprint 16's ConversationContext
 * (`base`) plus recent message history, internal notes, insurance providers,
 * and the AI persona/behavior settings.
 */
export interface AiConversationContext {
  base: ConversationContext;
  recentMessages: Message[];
  internalNotes: ConversationNote[];
  insuranceProviders: InsuranceProviderContext[];
  aiPromptSettings: AiPromptSettingsContext | null;
}

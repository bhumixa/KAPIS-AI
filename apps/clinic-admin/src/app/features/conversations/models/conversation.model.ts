export type ConversationStatus = 'open' | 'waiting' | 'ai_pending' | 'closed';

export const CONVERSATION_STATUSES: readonly ConversationStatus[] = [
  'open',
  'waiting',
  'ai_pending',
  'closed',
];

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Open',
  waiting: 'Waiting',
  ai_pending: 'AI Pending',
  closed: 'Closed',
};

export type ConversationChannel = 'whatsapp';

// Sprint 25 - the AI receptionist's intent classification and, while a
// booking/reschedule/cancel is mid-collection, what it's still waiting on.
export type ConversationIntent =
  | 'GENERAL_INQUIRY'
  | 'BOOK_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'EMERGENCY'
  | 'HANDOFF';

export const CONVERSATION_INTENT_LABELS: Record<ConversationIntent, string> = {
  GENERAL_INQUIRY: 'General Inquiry',
  BOOK_APPOINTMENT: 'Book Appointment',
  RESCHEDULE_APPOINTMENT: 'Reschedule Appointment',
  CANCEL_APPOINTMENT: 'Cancel Appointment',
  EMERGENCY: 'Emergency',
  HANDOFF: 'Handoff',
};

export type ConversationPendingAction = 'COLLECTING_FIELDS' | 'AWAITING_CONFIRMATION';

export const PENDING_ACTION_LABELS: Record<ConversationPendingAction, string> = {
  COLLECTING_FIELDS: 'Collecting information',
  AWAITING_CONFIRMATION: 'Awaiting confirmation',
};

/** Mirrors apps/api-server's booking slot-filling state (ai/dto/ai-intent.dto.ts's AiCollectedFields). */
export interface ConversationCollectedFields {
  doctorName: string | null;
  date: string | null;
  time: string | null;
  reason: string | null;
  newDate: string | null;
  newTime: string | null;
  appointmentReference: string | null;
  cancelConfirmed: string | null;
}

export interface Conversation {
  id: string;
  // Sprint 25 - nullable: a first-time WhatsApp sender's conversation
  // belongs to an Inquiry (lead, no patient yet) instead. Exactly one of
  // patientId/inquiryId is always set.
  patientId: string | null;
  inquiryId: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  /** FK to `ClinicUser.id` - `null` means unassigned. Kept here (not only in `ConversationAssignment`) so list/board views don't need to join assignment history just to show who owns a conversation today. */
  assignedToUserId: string | null;
  tags: string[];
  lastIntent: ConversationIntent | null;
  lastIntentConfidence: number | null;
  pendingAction: ConversationPendingAction | null;
  collectedFields: ConversationCollectedFields;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create payload - the mock service owns id and timestamps; status/assignment/tags
 * default and change via dedicated methods rather than a generic update.
 * `patientId` is required here (unlike `Conversation`'s nullable field) since
 * the only frontend caller creates a conversation for a known patient -
 * Inquiry-based conversations are only ever created by the backend's
 * WebhookService, never through this API from the UI.
 */
export type ConversationInput = { patientId: string } & Pick<Conversation, 'channel'>;

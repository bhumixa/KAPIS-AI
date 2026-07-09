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

export interface Conversation {
  id: string;
  patientId: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  /** FK to `ClinicUser.id` - `null` means unassigned. Kept here (not only in `ConversationAssignment`) so list/board views don't need to join assignment history just to show who owns a conversation today. */
  assignedToUserId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Create payload - the mock service owns id and timestamps; status/assignment/tags default and change via dedicated methods rather than a generic update. */
export type ConversationInput = Pick<Conversation, 'patientId' | 'channel'>;

import { ApiProperty } from '@nestjs/swagger';

export type ConversationChannel = 'whatsapp';
export type ConversationStatus = 'open' | 'waiting' | 'ai_pending' | 'closed';

export const CONVERSATION_STATUSES: ConversationStatus[] = [
  'open',
  'waiting',
  'ai_pending',
  'closed',
];

// Sprint 25 - the AI's classification of what the sender wants, and what
// (if anything) it's still waiting on before it can act. See
// database/migrations/047_create_inquiries.sql.
export type ConversationIntent =
  | 'GENERAL_INQUIRY'
  | 'BOOK_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'EMERGENCY'
  | 'HANDOFF';

export const CONVERSATION_INTENTS: ConversationIntent[] = [
  'GENERAL_INQUIRY',
  'BOOK_APPOINTMENT',
  'RESCHEDULE_APPOINTMENT',
  'CANCEL_APPOINTMENT',
  'EMERGENCY',
  'HANDOFF',
];

export type ConversationPendingAction = 'COLLECTING_FIELDS' | 'AWAITING_CONFIRMATION';

export const CONVERSATION_PENDING_ACTIONS: ConversationPendingAction[] = [
  'COLLECTING_FIELDS',
  'AWAITING_CONFIRMATION',
];

// Field-for-field mirror of apps/clinic-admin's Conversation model
// (features/conversations/models/conversation.model.ts) - see
// database/migrations/022_create_conversations.sql for the table this maps to.
export class ConversationDto {
  @ApiProperty()
  id!: string;

  // Sprint 25 - nullable: a conversation may belong to an Inquiry (lead, no
  // patient yet) instead. Exactly one of patientId/inquiryId is always set.
  @ApiProperty({ nullable: true })
  patientId!: string | null;

  @ApiProperty({ nullable: true })
  inquiryId!: string | null;

  @ApiProperty({ enum: ['whatsapp'] })
  channel!: ConversationChannel;

  @ApiProperty({ enum: CONVERSATION_STATUSES })
  status!: ConversationStatus;

  @ApiProperty({ nullable: true })
  assignedToUserId!: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ enum: CONVERSATION_INTENTS, nullable: true })
  lastIntent!: ConversationIntent | null;

  @ApiProperty({ nullable: true })
  lastIntentConfidence!: number | null;

  @ApiProperty({ enum: CONVERSATION_PENDING_ACTIONS, nullable: true })
  pendingAction!: ConversationPendingAction | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  collectedFields!: Record<string, string | null>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

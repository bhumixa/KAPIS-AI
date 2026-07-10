import { ApiProperty } from '@nestjs/swagger';

export type ConversationChannel = 'whatsapp';
export type ConversationStatus = 'open' | 'waiting' | 'ai_pending' | 'closed';

export const CONVERSATION_STATUSES: ConversationStatus[] = [
  'open',
  'waiting',
  'ai_pending',
  'closed',
];

// Field-for-field mirror of apps/clinic-admin's Conversation model
// (features/conversations/models/conversation.model.ts) - see
// database/migrations/022_create_conversations.sql for the table this maps to.
export class ConversationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  patientId!: string;

  @ApiProperty({ enum: ['whatsapp'] })
  channel!: ConversationChannel;

  @ApiProperty({ enum: CONVERSATION_STATUSES })
  status!: ConversationStatus;

  @ApiProperty({ nullable: true })
  assignedToUserId!: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

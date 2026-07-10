import { ApiProperty } from '@nestjs/swagger';

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageSender = 'patient' | 'staff' | 'ai';

export const MESSAGE_DIRECTIONS: MessageDirection[] = ['incoming', 'outgoing'];
export const MESSAGE_SENDERS: MessageSender[] = ['patient', 'staff', 'ai'];

// Field-for-field mirror of apps/clinic-admin's Message model
// (features/conversations/models/message.model.ts) - see
// database/migrations/023_create_messages.sql.
export class MessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ enum: MESSAGE_DIRECTIONS })
  direction!: MessageDirection;

  @ApiProperty({ enum: MESSAGE_SENDERS })
  sender!: MessageSender;

  @ApiProperty()
  senderName!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  read!: boolean;

  @ApiProperty()
  sentAt!: string;
}

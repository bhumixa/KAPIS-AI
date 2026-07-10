import { ApiProperty } from '@nestjs/swagger';

// Field-for-field mirror of apps/clinic-admin's ConversationNote model
// (features/conversations/models/conversation-note.model.ts) - see
// database/migrations/024_create_conversation_notes.sql.
export class ConversationNoteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty()
  authorName!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

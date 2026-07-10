import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

// Only `body` is ever edited (see apps/clinic-admin's
// ConversationService.updateNote(id, body)) - authorName is fixed at creation.
export class UpdateConversationNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;
}

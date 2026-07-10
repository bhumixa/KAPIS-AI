import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ConversationChannel } from './conversation.dto';

const CHANNELS: ConversationChannel[] = ['whatsapp'];

// Not part of the six required "Message APIs" endpoints, added alongside them
// so apps/clinic-admin's (unused-by-any-page, but public) ConversationService
// .createConversation() has a real endpoint to call, and so Sprint 16
// verification can create a conversation through the real API rather than
// hand-written SQL. A new conversation always starts 'open'/unassigned/untagged
// - see ConversationService.create().
export class CreateConversationDto {
  @ApiProperty()
  @IsUUID()
  patientId!: string;

  @ApiPropertyOptional({ enum: CHANNELS, default: 'whatsapp' })
  @IsOptional()
  @IsIn(CHANNELS)
  channel?: ConversationChannel;
}

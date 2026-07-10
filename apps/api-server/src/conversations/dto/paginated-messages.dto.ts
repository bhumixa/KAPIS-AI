import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export type TimelineEntryType = 'incoming' | 'outgoing' | 'internal_note' | 'ai_draft';

// The Conversation Timeline (Sprint 16 requirement 5) generalizes MessageDto
// with two entry types clinic.messages can never contain (its `direction`/
// `sender` CHECK constraints only allow incoming|outgoing and
// patient|staff|ai - see database/migrations/023_create_messages.sql):
// 'internal_note' (sourced from clinic.conversation_notes) and 'ai_draft'
// (no persistence anywhere yet - "No external AI APIs" this sprint - the type
// exists so a future AI drafting feature has a slot in the timeline without
// another shape change). Returned only when GET .../messages is called with
// `?includeNotes=true`; the default response stays plain MessageDto[] so
// apps/clinic-admin's Message model/MessageTimeline component need no changes.
export class TimelineEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['incoming', 'outgoing', 'internal_note', 'ai_draft'] })
  type!: TimelineEntryType;

  @ApiProperty()
  authorName!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  occurredAt!: string;
}

export class PaginatedMessagesDto {
  @ApiProperty({ type: [MessageDto] })
  items!: MessageDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export class PaginatedTimelineDto {
  @ApiProperty({ type: [TimelineEntryDto] })
  items!: TimelineEntryDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

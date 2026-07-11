import { ApiProperty } from '@nestjs/swagger';

// One row of GET /api/google-calendar/sync-history - mirrors
// clinic.google_calendar_sync_events, the append-only trace
// GoogleCalendarSyncService/GoogleCalendarWebhookService write to.
export class CalendarSyncLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true, description: 'Null for a NOTIFY row - see GoogleCalendarWebhookService.' })
  appointmentId!: string | null;

  @ApiProperty({ nullable: true })
  googleEventId!: string | null;

  @ApiProperty({ enum: ['CREATE', 'UPDATE', 'DELETE', 'NOTIFY'] })
  operation!: string;

  @ApiProperty({ enum: ['SUCCESS', 'FAILED'] })
  status!: string;

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  syncedAt!: string;
}

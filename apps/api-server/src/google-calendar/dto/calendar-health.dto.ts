import { ApiProperty } from '@nestjs/swagger';

// GET /api/google-calendar/health response - the exact four fields the
// Sprint 22 brief names: connected, calendarId, lastSync, provider. Mirrors
// WhatsappHealthDto/N8nHealthDto's shape for the same kind of "is this
// integration configured and working" question.
export class CalendarHealthDto {
  @ApiProperty({ description: 'Configured and reachable (a real Google Calendar API call succeeded).' })
  connected!: boolean;

  @ApiProperty({ nullable: true })
  calendarId!: string | null;

  @ApiProperty({ nullable: true })
  lastSync!: string | null;

  @ApiProperty()
  provider!: string;
}

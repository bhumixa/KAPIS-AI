import { ApiProperty } from '@nestjs/swagger';

// GET /api/google-calendar/stats response - backs the Automation Dashboard's
// three Sprint 22 tiles: Connection Status, Last Sync, Events Synced Today.
export class CalendarStatsDto {
  @ApiProperty()
  connected!: boolean;

  @ApiProperty({ enum: ['connected', 'disconnected', 'error'] })
  status!: 'connected' | 'disconnected' | 'error';

  @ApiProperty({ nullable: true })
  calendarId!: string | null;

  @ApiProperty({ nullable: true })
  lastSync!: string | null;

  @ApiProperty()
  eventsSyncedToday!: number;
}

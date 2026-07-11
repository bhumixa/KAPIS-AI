import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

/** GET /api/analytics/reports/google-calendar response - clinic.google_calendar_sync_events stats, the Sprint 23 "Google Calendar" report. */
export class GoogleCalendarAnalyticsDto {
  @ApiProperty()
  connected!: boolean;

  @ApiProperty()
  totalSyncedEvents!: number;

  @ApiProperty()
  eventsSyncedToday!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by GoogleCalendarSyncEvent.operation (CREATE/UPDATE/DELETE/NOTIFY).' })
  byOperation!: Record<string, number>;

  @ApiProperty({ description: '0-100, SUCCESS / (SUCCESS + FAILED).' })
  successRatePercent!: number;

  @ApiProperty()
  chart!: ChartSeriesDto;
}

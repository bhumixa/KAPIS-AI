import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

/** GET /api/analytics/reports/appointments response - the Sprint 23 "Appointments" report. */
export class AppointmentAnalyticsDto {
  @ApiProperty()
  totalAppointments!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by AppointmentDto.status.' })
  byStatus!: Record<string, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by AppointmentDto.type.' })
  byType!: Record<string, number>;

  @ApiProperty()
  chart!: ChartSeriesDto;
}

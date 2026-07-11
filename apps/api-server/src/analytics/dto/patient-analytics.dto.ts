import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

/** GET /api/analytics/reports/patients response - the Sprint 23 "Patients" report. */
export class PatientAnalyticsDto {
  @ApiProperty()
  totalPatients!: number;

  @ApiProperty()
  activePatients!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by Patient.gender.' })
  byGender!: Record<string, number>;

  @ApiProperty({ description: 'New patients registered per bucket, per the requested granularity.' })
  newPatientsChart!: ChartSeriesDto;
}

import { ApiProperty } from '@nestjs/swagger';

/** GET /api/analytics/health response - same shape HealthController/WorkflowRuntimeService's health DTOs use, scoped to the Analytics module's own single dependency (the database). */
export class AnalyticsHealthDto {
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ enum: ['up', 'down'] })
  database!: 'up' | 'down';
}

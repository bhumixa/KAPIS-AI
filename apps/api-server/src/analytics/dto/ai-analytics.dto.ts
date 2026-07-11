import { ApiProperty } from '@nestjs/swagger';
import { ChartSeriesDto } from './chart-series.dto';

/** GET /api/analytics/reports/ai response - clinic.ai_execution_history stats, the Sprint 23 "AI" report. */
export class AiAnalyticsDto {
  @ApiProperty()
  totalExecutions!: number;

  @ApiProperty()
  averageLatencyMs!: number;

  @ApiProperty()
  totalTokens!: number;

  @ApiProperty({ description: '0-100, success / (success + failed).' })
  successRatePercent!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by AiExecutionHistory.provider.' })
  byProvider!: Record<string, number>;

  @ApiProperty()
  chart!: ChartSeriesDto;
}

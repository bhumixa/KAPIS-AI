import { ApiProperty } from '@nestjs/swagger';
import { CHART_GRANULARITIES, ChartGranularity } from './analytics-query.dto';

/** One bucket in a chart series - `label` is the bucket's display date (Daily -> "2026-06-01", Monthly -> "2026-06", Yearly -> "2026"). */
export class ChartPointDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: number;
}

/** Response shape for every /api/analytics/charts/* endpoint - the Sprint 23 brief's "Charts: Daily/Weekly/Monthly/Yearly" requirement. */
export class ChartSeriesDto {
  @ApiProperty({ enum: CHART_GRANULARITIES })
  granularity!: ChartGranularity;

  @ApiProperty({ type: [ChartPointDto] })
  points!: ChartPointDto[];
}

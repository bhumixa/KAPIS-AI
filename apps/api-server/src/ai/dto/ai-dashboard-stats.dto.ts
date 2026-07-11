import { ApiProperty } from '@nestjs/swagger';

// GET /api/ai/stats response - AiHistoryService's history-derived stats
// (executionsToday/averageLatencyMs/totalTokensToday/successRatePercent)
// merged with the currently-configured provider/model (from AiProvider.getInfo(),
// no network call), for the Automation dashboard's stats strip.
export class AiDashboardStatsDto {
  @ApiProperty()
  executionsToday!: number;

  @ApiProperty()
  averageLatencyMs!: number;

  @ApiProperty()
  totalTokensToday!: number;

  @ApiProperty({ description: '0-100' })
  successRatePercent!: number;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  model!: string;
}

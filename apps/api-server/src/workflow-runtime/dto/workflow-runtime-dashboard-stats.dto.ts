import { ApiProperty } from '@nestjs/swagger';

/** GET /api/workflow-runtime/stats response - the Sprint 21 Automation Dashboard's "Running/Completed/Failed/Average.../Success Rate" tiles. */
export class WorkflowRuntimeDashboardStatsDto {
  @ApiProperty()
  running!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty()
  averageRuntimeMs!: number;

  @ApiProperty()
  averageAiLatencyMs!: number;

  @ApiProperty()
  averageWorkflowLatencyMs!: number;

  @ApiProperty({ description: '0-100, completed / (completed + failed).' })
  successRatePercent!: number;
}

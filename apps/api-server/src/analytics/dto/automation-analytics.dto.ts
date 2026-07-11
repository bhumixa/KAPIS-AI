import { ApiProperty } from '@nestjs/swagger';

/** GET /api/analytics/reports/automation response - end-to-end pipeline (clinic.workflow_runtime_executions) stats, the Sprint 23 "Automation" report. */
export class AutomationAnalyticsDto {
  @ApiProperty()
  running!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ description: '0-100, completed / (completed + failed).' })
  successRatePercent!: number;

  @ApiProperty()
  averageRuntimeMs!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Count by trigger source (e.g. whatsapp_webhook).' })
  byTriggerSource!: Record<string, number>;
}

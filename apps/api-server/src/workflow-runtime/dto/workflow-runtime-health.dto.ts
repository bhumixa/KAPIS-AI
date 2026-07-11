import { ApiProperty } from '@nestjs/swagger';

export class WorkflowRuntimeDependencyHealthDto {
  @ApiProperty()
  configured!: boolean;

  @ApiProperty()
  reachable!: boolean;
}

/**
 * GET /api/workflow-runtime/health response - aggregates the four
 * dependencies the Sprint 21 flow chains together (AI, WhatsApp, n8n,
 * Database) into one overall status, mirroring HealthController's
 * up/down shape for the database leg and each domain module's own
 * configured/reachable split (N8nHealthDto/WhatsappHealthDto/
 * AiProviderHealthDto) for the other three.
 */
export class WorkflowRuntimeHealthDto {
  @ApiProperty({ enum: ['ok', 'degraded', 'error'] })
  status!: 'ok' | 'degraded' | 'error';

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({ type: WorkflowRuntimeDependencyHealthDto })
  ai!: WorkflowRuntimeDependencyHealthDto;

  @ApiProperty({ type: WorkflowRuntimeDependencyHealthDto })
  whatsapp!: WorkflowRuntimeDependencyHealthDto;

  @ApiProperty({ type: WorkflowRuntimeDependencyHealthDto })
  n8n!: WorkflowRuntimeDependencyHealthDto;

  @ApiProperty({ enum: ['up', 'down'] })
  database!: 'up' | 'down';
}

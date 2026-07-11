import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowDecision } from '../enums/workflow-decision.enum';
import { WorkflowRunStatus } from '../enums/workflow-run-status.enum';

/** One clinic.workflow_runtime_executions row - the full end-to-end pipeline run for a single incoming WhatsApp message. */
export class WorkflowRuntimeExecutionDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  conversationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  messageId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  whatsappMessageId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'clinic.ai_execution_history row produced by AiOrchestratorService.generate().' })
  aiExecutionId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'clinic.workflow_executions row produced by N8nService.triggerWorkflow().' })
  n8nExecutionId!: string | null;

  @ApiProperty({ description: 'What kicked this run off, e.g. "whatsapp_webhook".' })
  triggerSource!: string;

  @ApiPropertyOptional({ enum: WorkflowDecision, nullable: true })
  decision!: WorkflowDecision | null;

  @ApiProperty({ enum: WorkflowRunStatus })
  status!: WorkflowRunStatus;

  @ApiProperty({ description: 'Number of retry attempts WorkflowRetryService made for this run.' })
  retryCount!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Wall-clock time of the AiOrchestratorService.generate() call, in milliseconds.' })
  aiLatencyMs!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Wall-clock time of the N8nService.triggerWorkflow() call, in milliseconds.' })
  workflowLatencyMs!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Wall-clock time of the whole run, in milliseconds.' })
  durationMs!: number | null;

  @ApiPropertyOptional({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  startedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sprint 15: a real call to n8n's webhook was made. 'success' means n8n accepted
 * the webhook call (2xx); 'failed' covers everything else - workflow not
 * imported/active in n8n, n8n unreachable, timeout, non-2xx response. The trigger
 * endpoint always resolves with one of these two (never throws for a failed n8n
 * call) so the caller always gets a full execution record back.
 */
export type WorkflowExecutionStatus = 'success' | 'failed';

export class WorkflowExecutionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workflowId!: string;

  @ApiProperty()
  workflowName!: string;

  @ApiProperty({ enum: ['success', 'failed'] })
  status!: WorkflowExecutionStatus;

  @ApiProperty()
  startedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  finishedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Wall-clock time of the n8n webhook call, in milliseconds.' })
  durationMs!: number | null;

  @ApiProperty({ type: 'object', additionalProperties: true, description: 'Body sent to the n8n webhook.' })
  requestPayload!: Record<string, unknown>;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description: 'Body n8n returned, when status is "success".',
  })
  responsePayload!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true, description: 'Human-readable failure reason, when status is "failed".' })
  errorMessage!: string | null;
}

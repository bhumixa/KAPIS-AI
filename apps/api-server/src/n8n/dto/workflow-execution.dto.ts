import { ApiProperty } from '@nestjs/swagger';

/**
 * Sprint 14 never calls n8n, so every execution resolves to 'mock_success'
 * immediately - this union exists so the trigger endpoint's response shape
 * doesn't change the day a real n8n call (and its real statuses) replaces
 * N8nService.triggerWorkflow()'s mock branch.
 */
export type WorkflowExecutionStatus = 'mock_success';

export class WorkflowExecutionDto {
  @ApiProperty()
  executionId!: string;

  @ApiProperty()
  workflowId!: string;

  @ApiProperty({ enum: ['mock_success'] })
  status!: WorkflowExecutionStatus;

  @ApiProperty()
  triggeredAt!: string;

  @ApiProperty()
  completedAt!: string;

  @ApiProperty({ nullable: true })
  triggeredBy!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload!: Record<string, unknown>;

  @ApiProperty({
    description:
      'The HTTP call that would be sent to n8n once real execution is wired up - not actually sent this sprint.',
    type: 'object',
    additionalProperties: true,
  })
  requestPreview!: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
}

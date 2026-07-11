import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStep, WorkflowStepStatus } from '../enums/workflow-step.enum';

/** One clinic.workflow_runtime_logs row - a single step's trace within a WorkflowRuntimeExecutionDto. */
export class WorkflowRuntimeLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workflowRuntimeId!: string;

  @ApiProperty({ enum: WorkflowStep })
  step!: WorkflowStep;

  @ApiProperty({ enum: WorkflowStepStatus })
  status!: WorkflowStepStatus;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;
}

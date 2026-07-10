import { ApiProperty } from '@nestjs/swagger';
import { WorkflowCategory, WorkflowTriggerType } from '../models/workflow-definition.model';

const CATEGORIES: WorkflowCategory[] = ['appointments', 'patients', 'conversations', 'automation'];
const TRIGGER_TYPES: WorkflowTriggerType[] = ['webhook', 'manual', 'event'];

export class WorkflowDefinitionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: CATEGORIES })
  category!: WorkflowCategory;

  @ApiProperty({ enum: TRIGGER_TYPES })
  triggerType!: WorkflowTriggerType;

  @ApiProperty()
  workflowFile!: string;

  @ApiProperty({ nullable: true })
  n8nWorkflowId!: string | null;

  @ApiProperty()
  active!: boolean;
}

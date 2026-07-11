import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { WorkflowRunStatus } from '../enums/workflow-run-status.enum';

export class QueryWorkflowRuntimeDto {
  @ApiPropertyOptional({ enum: WorkflowRunStatus })
  @IsOptional()
  @IsEnum(WorkflowRunStatus)
  status?: WorkflowRunStatus;

  @ApiPropertyOptional({ description: 'Filter to a single conversation.' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

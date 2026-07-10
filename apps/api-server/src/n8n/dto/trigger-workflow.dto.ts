import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

/** Request body for POST /n8n/workflows/:id/trigger. Both fields are optional - a trigger with no payload is valid. */
export class TriggerWorkflowDto {
  @ApiPropertyOptional({ description: 'Arbitrary JSON forwarded to the workflow as its input.' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Who/what triggered this run, for the execution log.' })
  @IsOptional()
  @IsString()
  triggeredBy?: string;
}

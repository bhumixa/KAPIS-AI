import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

// GET /api/google-calendar/sync-history query params - same
// "?limit=&optional filter" shape QueryWorkflowRuntimeDto uses.
export class QuerySyncHistoryDto {
  @ApiPropertyOptional({ description: 'Filter to a single appointment.' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

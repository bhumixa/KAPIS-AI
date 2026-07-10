import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsInt, IsOptional, Max, Min } from 'class-validator';

// Query-string values arrive as strings even with a numeric-typed field (the
// global ValidationPipe's enableImplicitConversion handles the page/pageSize
// coercion); includeNotes is validated as a boolean-ish string explicitly
// since "true"/"false" over the wire is never a real boolean type.
export class QueryMessagesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;

  @ApiPropertyOptional({
    default: false,
    description:
      'When true, returns the merged Conversation Timeline (messages + internal notes, ' +
      'chronologically ordered) instead of chat messages only.',
  })
  @IsOptional()
  @IsBooleanString()
  includeNotes?: string;
}

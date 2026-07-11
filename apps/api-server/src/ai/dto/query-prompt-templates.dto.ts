import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsOptional } from 'class-validator';
import { PROMPT_TEMPLATE_TYPES, PromptTemplateType } from './prompt-template.dto';

export class QueryPromptTemplatesDto {
  @ApiPropertyOptional({ enum: PROMPT_TEMPLATE_TYPES })
  @IsOptional()
  @IsIn(PROMPT_TEMPLATE_TYPES)
  type?: PromptTemplateType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}

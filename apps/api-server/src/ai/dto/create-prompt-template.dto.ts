import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PROMPT_TEMPLATE_TYPES, PromptTemplateType } from './prompt-template.dto';

export class CreatePromptTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: PROMPT_TEMPLATE_TYPES })
  @IsIn(PROMPT_TEMPLATE_TYPES)
  type!: PromptTemplateType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  systemPrompt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  userPromptTemplate!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PROMPT_TEMPLATE_TYPES, PromptTemplateType } from './prompt-template.dto';

export class GenerateRequestDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;

  @ApiPropertyOptional({
    enum: PROMPT_TEMPLATE_TYPES,
    description: 'Defaults to "general_question" when omitted.',
  })
  @IsOptional()
  @IsIn(PROMPT_TEMPLATE_TYPES)
  templateType?: PromptTemplateType;

  @ApiPropertyOptional({
    description: "Defaults to the conversation's last incoming message when omitted.",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  userQuestion?: string;
}

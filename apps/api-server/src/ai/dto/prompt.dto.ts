import { ApiProperty } from '@nestjs/swagger';
import { PROMPT_TEMPLATE_TYPES, PromptTemplateType } from './prompt-template.dto';

export class PromptMetadataDto {
  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ enum: PROMPT_TEMPLATE_TYPES })
  templateType!: PromptTemplateType;

  @ApiProperty({ nullable: true })
  templateId!: string | null;

  @ApiProperty()
  templateName!: string;

  @ApiProperty()
  promptTokenEstimate!: number;

  @ApiProperty()
  generatedAt!: string;
}

// What PromptBuilderService returns - the final system/user prompt pair plus
// metadata, and nothing else. No AI call happens here (see PromptBuilderService).
export class PromptDto {
  @ApiProperty()
  systemPrompt!: string;

  @ApiProperty()
  userPrompt!: string;

  @ApiProperty({ type: PromptMetadataDto })
  metadata!: PromptMetadataDto;
}

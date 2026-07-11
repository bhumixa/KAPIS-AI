import { ApiProperty } from '@nestjs/swagger';

// The seven scenarios the Sprint 17 brief names verbatim.
export type PromptTemplateType =
  | 'greeting'
  | 'appointment_booking'
  | 'appointment_cancellation'
  | 'follow_up'
  | 'prescription_reminder'
  | 'general_question'
  | 'emergency_escalation';

export const PROMPT_TEMPLATE_TYPES: PromptTemplateType[] = [
  'greeting',
  'appointment_booking',
  'appointment_cancellation',
  'follow_up',
  'prescription_reminder',
  'general_question',
  'emergency_escalation',
];

// Field-for-field mirror of database/migrations/034_create_prompt_templates.sql
// (clinic.prompt_templates).
export class PromptTemplateDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: PROMPT_TEMPLATE_TYPES })
  type!: PromptTemplateType;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  systemPrompt!: string;

  @ApiProperty()
  userPromptTemplate!: string;

  @ApiProperty({ type: [String] })
  variables!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

import { ApiProperty } from '@nestjs/swagger';

export type AiExecutionStatus = 'success' | 'failed';
export const AI_EXECUTION_STATUSES: AiExecutionStatus[] = ['success', 'failed'];

export type AiFinishReason = 'stop' | 'length' | 'escalated';

// What AIExecutionService returns - the exact shape the Sprint 17 brief
// specifies (response/tokens/model/latency/finishReason), split into
// prompt/completion/total token counts since AIHistoryService persists all
// three (see database/migrations/035_create_ai_execution_history.sql).
export class AiExecutionResultDto {
  @ApiProperty()
  response!: string;

  @ApiProperty()
  promptTokens!: number;

  @ApiProperty()
  completionTokens!: number;

  @ApiProperty()
  totalTokens!: number;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  latencyMs!: number;

  @ApiProperty()
  finishReason!: string;
}

// One persisted row from clinic.ai_execution_history - what AIHistoryService
// returns from GET /api/ai/history. Field-for-field mirror of
// database/migrations/035_create_ai_execution_history.sql.
export class AiExecutionHistoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ nullable: true })
  promptTemplateId!: string | null;

  @ApiProperty()
  systemPrompt!: string;

  @ApiProperty()
  userPrompt!: string;

  @ApiProperty()
  response!: string;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  promptTokens!: number;

  @ApiProperty()
  completionTokens!: number;

  @ApiProperty()
  totalTokens!: number;

  @ApiProperty()
  latencyMs!: number;

  @ApiProperty()
  finishReason!: string;

  @ApiProperty({ enum: AI_EXECUTION_STATUSES })
  status!: AiExecutionStatus;

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty()
  createdAt!: string;
}

import { PromptTemplateType } from './prompt-template.model';

export type AiExecutionStatus = 'success' | 'failed';

/** Mirrors apps/api-server's AiExecutionResultDto - AIExecutionService's (mock) output. */
export interface AiExecutionResult {
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: string;
  latencyMs: number;
  finishReason: string;
}

/** Mirrors apps/api-server's AiExecutionHistoryDto - one persisted clinic.ai_execution_history row. */
export interface AiExecutionHistory {
  id: string;
  conversationId: string;
  promptTemplateId: string | null;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  finishReason: string;
  status: AiExecutionStatus;
  errorMessage: string | null;
  createdAt: string;
}

/** POST /api/ai/generate request body - mirrors apps/api-server's GenerateRequestDto. */
export interface GenerateRequest {
  conversationId: string;
  templateType?: PromptTemplateType;
  userQuestion?: string;
}

/** GET /api/ai/stats response - mirrors apps/api-server's AiDashboardStats. */
export interface AiDashboardStats {
  executionsToday: number;
  averageLatencyMs: number;
}

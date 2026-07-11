import { PromptTemplateType } from './prompt-template.model';

export type AiExecutionStatus = 'success' | 'failed';

/** Mirrors apps/api-server's AiExecutionResultDto - AIExecutionService's output (real Claude call as of Sprint 18). */
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

/** GET /api/ai/stats response - mirrors apps/api-server's AiDashboardStatsDto. */
export interface AiDashboardStats {
  executionsToday: number;
  averageLatencyMs: number;
  totalTokensToday: number;
  /** 0-100. */
  successRatePercent: number;
  provider: string;
  model: string;
}

/** GET /api/ai/provider/health response - mirrors apps/api-server's AiProviderHealthDto. */
export interface AiProviderHealth {
  configured: boolean;
  reachable: boolean;
  model: string;
  provider: string;
}

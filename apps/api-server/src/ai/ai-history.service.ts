import { Injectable } from '@nestjs/common';
import { AiExecutionHistory } from '@prisma/client';
import { AiHistoryRepository } from './ai-history.repository';
import {
  AiExecutionHistoryDto,
  AiExecutionResultDto,
  AiExecutionStatus,
} from './dto/ai-execution.dto';
import { PromptDto } from './dto/prompt.dto';
import { QueryAiHistoryDto } from './dto/query-ai-history.dto';

const START_OF_TODAY = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

export interface AiDashboardStats {
  executionsToday: number;
  averageLatencyMs: number;
  totalTokensToday: number;
  /** 0-100. Defaults to 100 (no incidents) when there have been zero executions today. */
  successRatePercent: number;
}

/**
 * Persists every AIExecutionService run to clinic.ai_execution_history and
 * (Sprint 18) clinic.ai_provider_logs - the Sprint 17 brief's AIHistoryService,
 * extended for the real provider integration. Append-only: `record()` is the
 * only write, called by AIOrchestratorService right after execution
 * regardless of success/failure (see AIOrchestratorService.generate()).
 */
@Injectable()
export class AiHistoryService {
  constructor(private readonly repository: AiHistoryRepository) {}

  async record(
    prompt: PromptDto,
    result: AiExecutionResultDto,
    status: AiExecutionStatus = 'success',
    errorMessage: string | null = null,
  ): Promise<AiExecutionHistoryDto> {
    const saved = await this.repository.create({
      conversationId: prompt.metadata.conversationId,
      promptTemplateId: prompt.metadata.templateId,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      response: result.response,
      model: result.model,
      provider: result.provider,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      latencyMs: result.latencyMs,
      finishReason: result.finishReason,
      status,
      errorMessage,
    });

    // Sprint 18 - a provider-billing-metrics-only log row, written right
    // after the history row so it always has a real execution_id (see
    // 037_create_ai_provider_logs.sql's doc comment for why this order,
    // rather than the reverse, avoids an update-after-create).
    await this.repository.createProviderLog({
      executionId: saved.id,
      provider: result.provider,
      model: result.model,
      requestTokens: result.promptTokens,
      responseTokens: result.completionTokens,
      latencyMs: result.latencyMs,
      status,
      errorMessage,
    });

    return toHistoryDto(saved);
  }

  async findRecent(query: QueryAiHistoryDto): Promise<AiExecutionHistoryDto[]> {
    const history = await this.repository.findRecent(query.conversationId, query.limit ?? 50);
    return history.map(toHistoryDto);
  }

  async getDashboardStats(): Promise<AiDashboardStats> {
    const since = START_OF_TODAY();
    const [averageLatencyMs, totalTokensToday, statusCounts] = await Promise.all([
      this.repository.averageLatencyMsSince(since),
      this.repository.sumTotalTokensSince(since),
      this.repository.countByStatusSince(since),
    ]);
    const executionsToday = statusCounts.success + statusCounts.failed;
    const successRatePercent =
      executionsToday === 0 ? 100 : Math.round((statusCounts.success / executionsToday) * 100);
    return { executionsToday, averageLatencyMs, totalTokensToday, successRatePercent };
  }
}

function toHistoryDto(history: AiExecutionHistory): AiExecutionHistoryDto {
  return {
    id: history.id,
    conversationId: history.conversationId,
    promptTemplateId: history.promptTemplateId,
    systemPrompt: history.systemPrompt,
    userPrompt: history.userPrompt,
    response: history.response,
    model: history.model,
    provider: history.provider,
    promptTokens: history.promptTokens,
    completionTokens: history.completionTokens,
    totalTokens: history.totalTokens,
    latencyMs: history.latencyMs,
    finishReason: history.finishReason,
    status: history.status as AiExecutionStatus,
    errorMessage: history.errorMessage,
    createdAt: history.createdAt.toISOString(),
  };
}

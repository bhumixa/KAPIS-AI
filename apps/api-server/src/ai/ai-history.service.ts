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
}

/**
 * Persists every AIExecutionService run to clinic.ai_execution_history - the
 * Sprint 17 brief's AIHistoryService. Append-only: `record()` is the only
 * write, called by AIOrchestratorService right after execution regardless of
 * success/failure (see AIOrchestratorService.generate()).
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
    return toHistoryDto(saved);
  }

  async findRecent(query: QueryAiHistoryDto): Promise<AiExecutionHistoryDto[]> {
    const history = await this.repository.findRecent(query.conversationId, query.limit ?? 50);
    return history.map(toHistoryDto);
  }

  async getDashboardStats(): Promise<AiDashboardStats> {
    const since = START_OF_TODAY();
    const [executionsToday, averageLatencyMs] = await Promise.all([
      this.repository.countSince(since),
      this.repository.averageLatencyMsSince(since),
    ]);
    return { executionsToday, averageLatencyMs };
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

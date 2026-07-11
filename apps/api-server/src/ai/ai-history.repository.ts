import { Injectable } from '@nestjs/common';
import { AiExecutionHistory, AiProviderLog, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Per-status counts for the dashboard's "Success Rate" stat. */
export interface StatusCounts {
  success: number;
  failed: number;
}

// Thin Prisma wrapper over clinic.ai_execution_history and (Sprint 18)
// clinic.ai_provider_logs - append-only, same "no update()/mockable seam"
// shape WorkflowExecutionsRepository uses for clinic.workflow_executions.
@Injectable()
export class AiHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AiExecutionHistoryCreateInput): Promise<AiExecutionHistory> {
    return this.prisma.aiExecutionHistory.create({ data });
  }

  createProviderLog(data: Prisma.AiProviderLogCreateInput): Promise<AiProviderLog> {
    return this.prisma.aiProviderLog.create({ data });
  }

  findRecent(conversationId: string | undefined, limit: number): Promise<AiExecutionHistory[]> {
    return this.prisma.aiExecutionHistory.findMany({
      where: conversationId ? { conversationId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  countSince(since: Date): Promise<number> {
    return this.prisma.aiExecutionHistory.count({ where: { createdAt: { gte: since } } });
  }

  // Dashboard's "Average Latency" stat - averaged in the database rather than
  // pulling every row and averaging in Node, since the table is append-only
  // and can grow unbounded.
  async averageLatencyMsSince(since: Date): Promise<number> {
    const result = await this.prisma.aiExecutionHistory.aggregate({
      where: { createdAt: { gte: since } },
      _avg: { latencyMs: true },
    });
    return Math.round(result._avg.latencyMs ?? 0);
  }

  // Dashboard's "Token Usage" stat.
  async sumTotalTokensSince(since: Date): Promise<number> {
    const result = await this.prisma.aiExecutionHistory.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { totalTokens: true },
    });
    return result._sum.totalTokens ?? 0;
  }

  // Dashboard's "Success Rate" stat - counted per status rather than fetched
  // and reduced in Node, same reasoning averageLatencyMsSince() uses.
  async countByStatusSince(since: Date): Promise<StatusCounts> {
    const [success, failed] = await Promise.all([
      this.prisma.aiExecutionHistory.count({
        where: { createdAt: { gte: since }, status: 'success' },
      }),
      this.prisma.aiExecutionHistory.count({
        where: { createdAt: { gte: since }, status: 'failed' },
      }),
    ]);
    return { success, failed };
  }
}

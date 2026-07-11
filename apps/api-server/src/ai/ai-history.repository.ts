import { Injectable } from '@nestjs/common';
import { AiExecutionHistory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Thin Prisma wrapper over clinic.ai_execution_history - append-only, same
// "no update()/mockable seam" shape WorkflowExecutionsRepository uses for
// clinic.workflow_executions.
@Injectable()
export class AiHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AiExecutionHistoryCreateInput): Promise<AiExecutionHistory> {
    return this.prisma.aiExecutionHistory.create({ data });
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
}

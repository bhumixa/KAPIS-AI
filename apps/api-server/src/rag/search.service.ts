import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeSearchResultDto } from './dto/knowledge-search-result.dto';
import { KnowledgeRepository } from './knowledge.repository';

/** How many recent searches getStats() averages over - a rolling window, not a lifetime total. */
const STATS_SAMPLE_SIZE = 50;

export interface SearchOutcome {
  results: KnowledgeSearchResultDto[];
  latencyMs: number;
}

export interface SearchStats {
  averageSearchLatencyMs: number;
  averageResultCount: number;
  searchCount: number;
}

/**
 * The "Search" step of the RAG pipeline (Sprint 19 brief): runs
 * clinic.rag_search() (PostgreSQL full-text search - tsvector/tsquery only,
 * no embeddings) via KnowledgeRepository and times it. Never throws - if the
 * migration hasn't been applied yet (clinic.rag_search() missing) or any
 * other query error occurs, it logs a warning and returns an empty result
 * set, the same "degrade, don't crash the pipeline" policy
 * N8nService/AiOrchestratorService use for their own downstream failures.
 * Ranking/grouping happen one layer up (RankingService/
 * KnowledgeAssemblerService) - this service only retrieves and measures.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly recentLatenciesMs: number[] = [];
  private readonly recentResultCounts: number[] = [];

  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async search(query: string, limit: number): Promise<SearchOutcome> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [], latencyMs: 0 };
    }

    const start = Date.now();
    try {
      const rows = await this.knowledgeRepository.search(trimmed, limit);
      const latencyMs = Date.now() - start;
      const results = rows.map((row, index) => ({
        rank: index + 1,
        source: row.source,
        sourceId: row.sourceId,
        title: row.title,
        snippet: row.snippet,
        score: Number(row.score),
      }));
      this.recordSample(latencyMs, results.length);
      return { results, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Full-text search failed - has database/migrations/038_create_fulltext_indexes.sql been applied? ${message}`,
      );
      this.recordSample(latencyMs, 0);
      return { results: [], latencyMs };
    }
  }

  getStats(): SearchStats {
    return {
      averageSearchLatencyMs: this.average(this.recentLatenciesMs),
      averageResultCount: this.average(this.recentResultCounts),
      searchCount: this.recentLatenciesMs.length,
    };
  }

  private recordSample(latencyMs: number, resultCount: number): void {
    this.recentLatenciesMs.push(latencyMs);
    this.recentResultCounts.push(resultCount);
    if (this.recentLatenciesMs.length > STATS_SAMPLE_SIZE) {
      this.recentLatenciesMs.shift();
      this.recentResultCounts.shift();
    }
  }

  private average(samples: number[]): number {
    if (samples.length === 0) {
      return 0;
    }
    return Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
  }
}

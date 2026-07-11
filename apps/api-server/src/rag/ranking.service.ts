import { Injectable } from '@nestjs/common';
import { KnowledgeSearchResultDto } from './dto/knowledge-search-result.dto';

/**
 * The "Ranking" step of the RAG pipeline (Sprint 19 brief), kept separate
 * from SearchService (which only retrieves) so relevance policy - result
 * limit, per-source diversity - lives in one place callers can reuse
 * independently of how results were fetched. clinic.rag_search() already
 * orders by ts_rank_cd, so re-sorting here mostly matters after
 * capPerSource() reduces the set.
 */
@Injectable()
export class RankingService {
  /** Highest-scoring results first, re-numbered 1..N, trimmed to `limit`. */
  rank(results: KnowledgeSearchResultDto[], limit: number): KnowledgeSearchResultDto[] {
    return [...results]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((result, index) => ({ ...result, rank: index + 1 }));
  }

  /**
   * Keeps at most `perSourceLimit` results per source, highest score first -
   * stops one very active source (e.g. many matching FAQs) from crowding out
   * every other knowledge source in the final prompt.
   */
  capPerSource(results: KnowledgeSearchResultDto[], perSourceLimit: number): KnowledgeSearchResultDto[] {
    const bySource = new Map<string, KnowledgeSearchResultDto[]>();
    for (const result of [...results].sort((a, b) => b.score - a.score)) {
      const bucket = bySource.get(result.source) ?? [];
      if (bucket.length < perSourceLimit) {
        bucket.push(result);
        bySource.set(result.source, bucket);
      }
    }
    return [...bySource.values()].flat();
  }
}

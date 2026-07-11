import { Injectable } from '@nestjs/common';
import { KnowledgeSearchResultDto } from './dto/knowledge-search-result.dto';
import { RetrievedKnowledgeDto } from './dto/retrieved-knowledge.dto';
import { KnowledgeAssemblerService } from './knowledge-assembler.service';
import { RankingService } from './ranking.service';
import { SearchOutcome, SearchService } from './search.service';

/** Results returned per source before ranking/capping - overfetched so capPerSource() has enough per-source candidates to choose from. */
const OVERFETCH_MULTIPLIER = 4;
/** Default cap on total items in a RetrievedKnowledgeDto - keeps the prompt's "relevant knowledge" sections short (never "dump the whole database"). */
const DEFAULT_RESULT_LIMIT = 12;
/** Max items per category inside a RetrievedKnowledgeDto. */
const PER_SOURCE_LIMIT = 3;

/**
 * The Knowledge Retrieval Engine itself - the single entry point the brief's
 * architecture diagram places between the Conversation Context Builder and
 * the Prompt Builder. Composes SearchService (retrieve) -> RankingService
 * (rank/cap) -> KnowledgeAssemblerService (group), the same "one facade,
 * several single-purpose collaborators" shape AiOrchestratorService uses one
 * layer up. ConversationContextBuilderService calls retrieve(); RagController
 * calls search() directly for the raw GET /rag/search endpoint.
 */
@Injectable()
export class KnowledgeRetrievalService {
  constructor(
    private readonly searchService: SearchService,
    private readonly rankingService: RankingService,
    private readonly knowledgeAssemblerService: KnowledgeAssemblerService,
  ) {}

  /** Full pipeline: search, rank, group into prompt-ready categories. */
  async retrieve(query: string, limit: number = DEFAULT_RESULT_LIMIT): Promise<RetrievedKnowledgeDto> {
    if (!query.trim()) {
      return this.knowledgeAssemblerService.assemble(query, []);
    }

    const { results } = await this.searchService.search(query, limit * OVERFETCH_MULTIPLIER);
    const capped = this.rankingService.capPerSource(results, PER_SOURCE_LIMIT);
    const ranked = this.rankingService.rank(capped, limit);
    return this.knowledgeAssemblerService.assemble(query, ranked);
  }

  /** Flat, ranked results for GET /rag/search - no per-category grouping/capping. */
  async search(query: string, limit: number): Promise<{ results: KnowledgeSearchResultDto[]; latencyMs: number }> {
    const outcome: SearchOutcome = await this.searchService.search(query, limit);
    return { results: this.rankingService.rank(outcome.results, limit), latencyMs: outcome.latencyMs };
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { KnowledgeSearchResultDto } from './dto/knowledge-search-result.dto';
import { RagDashboardStatsDto } from './dto/rag-dashboard-stats.dto';
import { RagHealthDto } from './dto/rag-health.dto';
import { RagSearchQueryDto } from './dto/rag-search-query.dto';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { RagIndexerService } from './rag-indexer.service';
import { SearchService } from './search.service';

const DEFAULT_SEARCH_LIMIT = 10;

// @Public() on every route, same escape hatch every other business controller
// uses until a real login endpoint exists (see n8n.controller.ts).
@Public()
@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(
    private readonly knowledgeRetrievalService: KnowledgeRetrievalService,
    private readonly ragIndexerService: RagIndexerService,
    private readonly searchService: SearchService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary:
      'RAG engine health - whether clinic.rag_search() is present, which knowledge sources have ' +
      'indexed rows, and when RagIndexerService last computed that (application startup)',
  })
  getHealth(): RagHealthDto {
    return this.ragIndexerService.getHealth();
  }

  @Get('search')
  @ApiOperation({
    summary:
      'Search every knowledge source (services, FAQs, policies, insurance providers, doctor ' +
      'profiles, message templates, clinic profile, appointment settings, AI prompt settings) ' +
      'via PostgreSQL full-text search (tsvector/tsquery - no embeddings). Ranked by relevance.',
  })
  async search(@Query() query: RagSearchQueryDto): Promise<KnowledgeSearchResultDto[]> {
    const { results } = await this.knowledgeRetrievalService.search(query.q, query.limit ?? DEFAULT_SEARCH_LIMIT);
    return results;
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Indexed document count, average search latency, and average result count - for the Automation dashboard',
  })
  getStats(): RagDashboardStatsDto {
    const searchStats = this.searchService.getStats();
    return {
      indexedDocuments: this.ragIndexerService.getIndexedDocumentCount(),
      indexedSourceCount: this.ragIndexerService.getIndexedSourceCount(),
      searchLatencyMs: searchStats.averageSearchLatencyMs,
      averageResults: searchStats.averageResultCount,
    };
  }
}

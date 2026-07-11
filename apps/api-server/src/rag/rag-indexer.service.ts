import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KnowledgeSourceType } from './dto/knowledge-search-result.dto';
import { RagHealthDto } from './dto/rag-health.dto';
import { KnowledgeRepository } from './knowledge.repository';

const SEARCH_PROVIDER = 'postgres-fulltext';

/**
 * Sprint 19's "Indexing" requirement: build the index once, at application
 * startup, via OnModuleInit - no cron, no queue, no background worker. There
 * is no separate index to *build* here in the traditional sense - the actual
 * indexes are the GIN indexes 038_create_fulltext_indexes.sql creates
 * against Postgres's own generated tsvector columns, which exist and stay
 * current the moment a row is inserted/updated (or, for
 * clinic.doctor_profiles, via its BEFORE INSERT/UPDATE trigger - see that
 * migration). What RagIndexerService actually does is compute the metadata
 * GET /rag/health and the Automation dashboard need (which sources have
 * matchable rows right now, whether clinic.rag_search() itself is present)
 * once, cache it, and serve it from memory rather than re-querying on every
 * request. Never throws - KnowledgeRepository's own per-source try/catch
 * already isolates failures, so a completely unmigrated database still boots
 * the app with `enabled: false`.
 */
@Injectable()
export class RagIndexerService implements OnModuleInit {
  private readonly logger = new Logger(RagIndexerService.name);
  private indexedSources: KnowledgeSourceType[] = [];
  private totalIndexedDocuments = 0;
  private searchAvailable = false;
  private lastIndexTime: Date | null = null;

  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  async onModuleInit(): Promise<void> {
    await this.buildIndex();
  }

  async buildIndex(): Promise<void> {
    const [counts, searchAvailable] = await Promise.all([
      this.knowledgeRepository.countIndexedDocuments(),
      this.knowledgeRepository.isSearchFunctionAvailable(),
    ]);

    this.indexedSources = (Object.entries(counts) as [KnowledgeSourceType, number][])
      .filter(([, count]) => count > 0)
      .map(([source]) => source);
    this.totalIndexedDocuments = Object.values(counts).reduce((sum, count) => sum + count, 0);
    this.searchAvailable = searchAvailable;
    this.lastIndexTime = new Date();

    if (!searchAvailable) {
      this.logger.warn(
        'clinic.rag_search() not found - apply database/migrations/038_create_fulltext_indexes.sql to enable RAG search.',
      );
    }
    this.logger.log(
      `RAG index ready: ${this.totalIndexedDocuments} document(s) across ${this.indexedSources.length} source(s), search ${searchAvailable ? 'enabled' : 'disabled'}.`,
    );
  }

  getHealth(): RagHealthDto {
    return {
      enabled: this.searchAvailable,
      searchProvider: SEARCH_PROVIDER,
      indexedSources: this.indexedSources,
      lastIndexTime: this.lastIndexTime?.toISOString() ?? null,
    };
  }

  getIndexedDocumentCount(): number {
    return this.totalIndexedDocuments;
  }

  getIndexedSourceCount(): number {
    return this.indexedSources.length;
  }
}

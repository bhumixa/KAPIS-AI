import { ApiProperty } from '@nestjs/swagger';

// GET /rag/health response. `enabled` reflects whether clinic.rag_search()
// itself exists (via KnowledgeRepository.isSearchFunctionAvailable(), a
// to_regprocedure(...) probe - see 038_create_fulltext_indexes.sql) - not
// whether any knowledge rows exist. Same "configured vs. reachable" split
// N8nHealthDto/AiProviderHealthDto already use, applied to a database
// function's presence instead of a network call's success.
export class RagHealthDto {
  @ApiProperty({ description: 'Whether clinic.rag_search() (038_create_fulltext_indexes.sql) exists in the connected database.' })
  enabled!: boolean;

  @ApiProperty({ description: 'The search backend in use - always "postgres-fulltext" this sprint (no embeddings/vector DB).' })
  searchProvider!: string;

  @ApiProperty({ type: [String], description: 'Knowledge sources with at least one indexed (searchable) row right now.' })
  indexedSources!: string[];

  @ApiProperty({ nullable: true, description: 'ISO timestamp RagIndexerService last (re)computed indexedSources/document counts, or null before startup indexing has run.' })
  lastIndexTime!: string | null;
}

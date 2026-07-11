import { ApiProperty } from '@nestjs/swagger';

/** GET /rag/stats response - for the Automation dashboard's RAG tiles. */
export class RagDashboardStatsDto {
  @ApiProperty({ description: 'Total rows currently matchable across every knowledge source (RagIndexerService.buildIndex()).' })
  indexedDocuments!: number;

  @ApiProperty({ description: 'Number of distinct knowledge sources with at least one indexed row.' })
  indexedSourceCount!: number;

  @ApiProperty({ description: 'Rolling average latency (ms) of the last 50 searches - both GET /rag/search calls and internal KnowledgeRetrievalService.retrieve() calls made while building an AI prompt.' })
  searchLatencyMs!: number;

  @ApiProperty({ description: 'Rolling average result count of the last 50 searches.' })
  averageResults!: number;
}

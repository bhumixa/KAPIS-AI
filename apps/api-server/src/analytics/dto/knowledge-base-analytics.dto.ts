import { ApiProperty } from '@nestjs/swagger';

/**
 * GET /api/analytics/reports/knowledge-base response - the Sprint 23
 * "Knowledge Base" report. Counts the same browsable knowledge sources
 * RagIndexerService indexes (see rag/knowledge.repository.ts's SOURCE_COUNTERS),
 * minus the three singleton settings rows (clinic_profile/appointment_settings/
 * ai_prompt_setting) which aren't "items" a user browses - AnalyticsRepository
 * counts these independently via plain Prisma `.count()` calls, the same
 * read-only aggregation every other analytics figure uses, not a
 * reimplementation of RAG's search/ranking logic.
 */
export class KnowledgeBaseAnalyticsDto {
  @ApiProperty()
  totalItems!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  bySource!: Record<string, number>;
}

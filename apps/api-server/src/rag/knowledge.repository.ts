import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeSourceType } from './dto/knowledge-search-result.dto';

/** Raw shape of one clinic.rag_search() row - column names as Postgres returns them. */
interface RagSearchRow {
  source: KnowledgeSourceType;
  sourceId: string;
  title: string;
  snippet: string;
  score: number;
}

const SOURCE_COUNTERS: Record<KnowledgeSourceType, (prisma: PrismaService) => Promise<number>> = {
  clinic_service: (prisma) => prisma.clinicService.count({ where: { status: 'active' } }),
  faq: (prisma) => prisma.faq.count({ where: { status: 'published' } }),
  policy: (prisma) => prisma.policy.count({ where: { status: 'active' } }),
  insurance_provider: (prisma) => prisma.insuranceProvider.count({ where: { status: 'active' } }),
  doctor_profile: (prisma) => prisma.doctorProfile.count(),
  message_template: (prisma) => prisma.messageTemplate.count(),
  clinic_profile: (prisma) => prisma.clinic.count(),
  appointment_settings: (prisma) => prisma.clinic.count(),
  ai_prompt_setting: (prisma) => prisma.aiPromptSetting.count(),
};

/**
 * Thin Prisma wrapper - same role WorkflowExecutionsRepository/
 * AiHistoryRepository play for their modules. Every query here either calls
 * clinic.rag_search() (038_create_fulltext_indexes.sql) via $queryRaw, or
 * counts base tables through the regular Prisma client (no raw SQL needed
 * for a plain count). Nothing here catches errors - SearchService/
 * RagIndexerService decide how to degrade if a query fails (e.g. the
 * migration hasn't been applied yet), matching the "repository stays a thin
 * query layer, service holds the failure-handling policy" split the rest of
 * the codebase uses.
 */
@Injectable()
export class KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  search(query: string, limit: number): Promise<RagSearchRow[]> {
    return this.prisma.$queryRaw<RagSearchRow[]>`
      SELECT source, source_id AS "sourceId", title, snippet, score
      FROM clinic.rag_search(${query}, ${limit})
    `;
  }

  /** to_regprocedure(...) is a catalog lookup, not a call - side-effect-free and cheap enough to run on every health check. */
  async isSearchFunctionAvailable(): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ available: boolean }[]>`
      SELECT to_regprocedure('clinic.rag_search(text, integer)') IS NOT NULL AS available
    `;
    return rows[0]?.available ?? false;
  }

  /** One independent count per source, tolerant of any single source's table/column not existing yet (038/015 not applied) - never lets one missing source zero out the rest. */
  async countIndexedDocuments(): Promise<Record<KnowledgeSourceType, number>> {
    const entries = await Promise.all(
      (Object.entries(SOURCE_COUNTERS) as [KnowledgeSourceType, (prisma: PrismaService) => Promise<number>][]).map(
        async ([source, count]) => {
          try {
            return [source, await count(this.prisma)] as const;
          } catch {
            return [source, 0] as const;
          }
        },
      ),
    );
    return Object.fromEntries(entries) as Record<KnowledgeSourceType, number>;
  }
}

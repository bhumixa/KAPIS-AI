/** Mirrors apps/api-server's RagHealthDto (GET /api/rag/health). */
export interface RagHealth {
  enabled: boolean;
  searchProvider: string;
  indexedSources: string[];
  lastIndexTime: string | null;
}

/** Mirrors apps/api-server's RagDashboardStatsDto (GET /api/rag/stats). */
export interface RagDashboardStats {
  indexedDocuments: number;
  indexedSourceCount: number;
  searchLatencyMs: number;
  averageResults: number;
}

export type KnowledgeSourceType =
  | 'clinic_service'
  | 'faq'
  | 'policy'
  | 'insurance_provider'
  | 'doctor_profile'
  | 'message_template'
  | 'clinic_profile'
  | 'appointment_settings'
  | 'ai_prompt_setting';

/** Mirrors apps/api-server's KnowledgeSearchResultDto (GET /api/rag/search). */
export interface KnowledgeSearchResult {
  rank: number;
  source: KnowledgeSourceType;
  sourceId: string;
  title: string;
  snippet: string;
  score: number;
}

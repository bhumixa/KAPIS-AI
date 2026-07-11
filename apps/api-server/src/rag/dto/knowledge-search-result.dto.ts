import { ApiProperty } from '@nestjs/swagger';

// One row per clinic.rag_search() match (database/migrations/038_create_fulltext_indexes.sql) -
// mirrors that function's RETURNS TABLE shape field-for-field, plus `rank`
// (1-based position after RankingService re-sorts/trims, not something
// Postgres returns).
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

export const KNOWLEDGE_SOURCE_TYPES: KnowledgeSourceType[] = [
  'clinic_service',
  'faq',
  'policy',
  'insurance_provider',
  'doctor_profile',
  'message_template',
  'clinic_profile',
  'appointment_settings',
  'ai_prompt_setting',
];

export class KnowledgeSearchResultDto {
  @ApiProperty({ description: '1-based position in the ranked result list.' })
  rank!: number;

  @ApiProperty({ enum: KNOWLEDGE_SOURCE_TYPES })
  source!: KnowledgeSourceType;

  @ApiProperty({ description: 'Primary key of the row in its source table (text, not uuid - ai_prompt_setting uses a smallint id).' })
  sourceId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'ts_headline-generated excerpt with the matched terms wrapped in <b>...</b>.' })
  snippet!: string;

  @ApiProperty({ description: 'ts_rank_cd relevance score - higher is more relevant, not bounded to [0,1].' })
  score!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { KnowledgeSearchResultDto } from './knowledge-search-result.dto';

// The Knowledge Retrieval Engine's output for one query - grouped into the
// six categories PromptBuilderService's brief names verbatim (Relevant
// Services/FAQs/Policies/Insurance/Doctor Information/Templates). Only ever
// holds items clinic.rag_search() actually matched the query - never the
// full table, per the "never dump the whole database" requirement.
export class RetrievedKnowledgeDto {
  @ApiProperty({ description: 'The text KnowledgeRetrievalService searched with (usually the patient\'s last incoming message).' })
  query!: string;

  @ApiProperty({ type: [KnowledgeSearchResultDto] })
  services!: KnowledgeSearchResultDto[];

  @ApiProperty({ type: [KnowledgeSearchResultDto] })
  faqs!: KnowledgeSearchResultDto[];

  @ApiProperty({ type: [KnowledgeSearchResultDto] })
  policies!: KnowledgeSearchResultDto[];

  @ApiProperty({ type: [KnowledgeSearchResultDto] })
  insuranceProviders!: KnowledgeSearchResultDto[];

  @ApiProperty({ type: [KnowledgeSearchResultDto] })
  doctorProfiles!: KnowledgeSearchResultDto[];

  @ApiProperty({ type: [KnowledgeSearchResultDto] })
  messageTemplates!: KnowledgeSearchResultDto[];
}

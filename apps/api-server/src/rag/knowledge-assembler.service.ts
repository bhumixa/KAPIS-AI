import { Injectable } from '@nestjs/common';
import { KnowledgeSearchResultDto } from './dto/knowledge-search-result.dto';
import { RetrievedKnowledgeDto } from './dto/retrieved-knowledge.dto';

/**
 * The "Context Assembly" step of the RAG pipeline (Sprint 19 brief): groups
 * a flat, ranked KnowledgeSearchResultDto[] into the six named categories
 * PromptBuilderService renders (Relevant Services/FAQs/Policies/Insurance/
 * Doctor Information/Templates). clinic_profile/appointment_settings/
 * ai_prompt_setting matches are intentionally dropped here - the prompt
 * already gets that information from AiConversationContextDto.base.clinicProfile/
 * aiPromptSettings (Sprint 16/17), so surfacing them again as "search
 * results" would be redundant, not "relevant knowledge."
 */
@Injectable()
export class KnowledgeAssemblerService {
  assemble(query: string, results: KnowledgeSearchResultDto[]): RetrievedKnowledgeDto {
    const bySource = (source: KnowledgeSearchResultDto['source']): KnowledgeSearchResultDto[] =>
      results.filter((result) => result.source === source);

    return {
      query,
      services: bySource('clinic_service'),
      faqs: bySource('faq'),
      policies: bySource('policy'),
      insuranceProviders: bySource('insurance_provider'),
      doctorProfiles: bySource('doctor_profile'),
      messageTemplates: bySource('message_template'),
    };
  }
}

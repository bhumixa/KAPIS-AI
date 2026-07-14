import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { RagModule } from '../rag/rag.module';
import { AiExecutionService } from './ai-execution.service';
import { AiHistoryRepository } from './ai-history.repository';
import { AiHistoryService } from './ai-history.service';
import { AiController } from './ai.controller';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ConversationContextBuilderService } from './conversation-context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { PromptTemplateService } from './prompt-template.service';
import { PromptTemplatesController } from './prompt-templates.controller';
import { PromptTemplatesRepository } from './prompt-templates.repository';

/**
 * The AI Orchestration Engine (Sprint 17, real Gemini provider as of Sprint
 * 24). ConversationContextBuilderService assembles context by composing
 * ConversationsModule's Sprint 16 services
 * (never re-deriving patient/doctor/appointment/knowledge-base logic - see
 * that service's doc comment), PromptBuilderService turns context into a
 * prompt, AIExecutionService runs it through the AI_PROVIDER token bound by
 * GeminiModule (real HTTPS calls to Google's Gemini API - see
 * apps/api-server/src/gemini/), and AIHistoryService persists every run.
 * AIOrchestratorService is the one place all four are wired together - see
 * its doc comment for why callers should go through it rather than composing
 * the pieces themselves. Importing GeminiModule here (rather than
 * AiExecutionService importing GeminiProviderService directly) is what keeps
 * the orchestration chain depending on the AI_PROVIDER interface, not on
 * Gemini - swapping providers later means importing a different module here,
 * not touching ai/ at all. RagModule (Sprint 19) is imported the same way,
 * for the same reason: ConversationContextBuilderService depends on
 * KnowledgeRetrievalService (an exported facade), never on Search/Ranking/
 * KnowledgeAssembler/RagIndexer directly. DoctorsModule (Sprint 25) is
 * imported for the same reason - ConversationContextBuilderService reuses
 * DoctorsService's findAll()/DoctorDto mapping to ground every prompt in the
 * real doctor directory, rather than relying solely on RAG search relevance
 * (which can easily miss a doctor for a generic query and leave the AI to
 * invent one).
 */
@Module({
  imports: [ConversationsModule, GeminiModule, RagModule, DoctorsModule],
  controllers: [AiController, PromptTemplatesController],
  providers: [
    PromptTemplatesRepository,
    PromptTemplateService,
    ConversationContextBuilderService,
    PromptBuilderService,
    AiExecutionService,
    AiHistoryRepository,
    AiHistoryService,
    AiOrchestratorService,
  ],
  exports: [AiOrchestratorService, PromptTemplateService],
})
export class AiOrchestratorModule {}

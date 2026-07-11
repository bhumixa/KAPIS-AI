import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
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
 * The AI Orchestration Engine (Sprint 17) - the backend every future AI
 * provider (Claude/OpenAI/Gemini) will plug into. Per the brief, this module
 * calls no external LLM: ConversationContextBuilderService assembles context
 * by composing ConversationsModule's Sprint 16 services (never re-deriving
 * patient/doctor/appointment/knowledge-base logic - see that service's doc
 * comment), PromptBuilderService turns context into a prompt,
 * AIExecutionService fakes a deterministic response, and AIHistoryService
 * persists every run. AIOrchestratorService is the one place all four are
 * wired together - see its doc comment for why callers should go through it
 * rather than composing the pieces themselves.
 */
@Module({
  imports: [ConversationsModule],
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

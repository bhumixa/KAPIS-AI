import { Module } from '@nestjs/common';
import { ClaudeModule } from '../claude/claude.module';
import { ConversationsModule } from '../conversations/conversations.module';
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
 * The AI Orchestration Engine (Sprint 17, real Claude provider as of Sprint 18).
 * ConversationContextBuilderService assembles context by composing
 * ConversationsModule's Sprint 16 services (never re-deriving patient/doctor/
 * appointment/knowledge-base logic - see that service's doc comment),
 * PromptBuilderService turns context into a prompt, AIExecutionService runs it
 * through the AI_PROVIDER token bound by ClaudeModule (real HTTPS calls to
 * Anthropic - see apps/api-server/src/claude/), and AIHistoryService persists
 * every run. AIOrchestratorService is the one place all four are wired
 * together - see its doc comment for why callers should go through it rather
 * than composing the pieces themselves. Importing ClaudeModule here (rather
 * than AiExecutionService importing ClaudeProviderService directly) is what
 * keeps the orchestration chain depending on the AI_PROVIDER interface, not
 * on Claude - swapping providers later means importing a different module
 * here, not touching ai/ at all. RagModule (Sprint 19) is imported the same
 * way, for the same reason: ConversationContextBuilderService depends on
 * KnowledgeRetrievalService (an exported facade), never on Search/Ranking/
 * KnowledgeAssembler/RagIndexer directly.
 */
@Module({
  imports: [ConversationsModule, ClaudeModule, RagModule],
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

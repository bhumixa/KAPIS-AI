import { Module } from '@nestjs/common';
import { KnowledgeAssemblerService } from './knowledge-assembler.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { KnowledgeRepository } from './knowledge.repository';
import { RagController } from './rag.controller';
import { RagIndexerService } from './rag-indexer.service';
import { RankingService } from './ranking.service';
import { SearchService } from './search.service';

/**
 * The RAG Engine (Sprint 19): Conversation Context Builder -> Knowledge
 * Retrieval Engine -> Prompt Builder, per the brief's architecture diagram.
 * PrismaService comes from the @Global() PrismaModule (see
 * prisma.module.ts), so KnowledgeRepository needs no explicit import here -
 * same pattern every other module's Prisma-backed repository already
 * follows. Exports only KnowledgeRetrievalService - the one collaborator
 * AiOrchestratorModule's ConversationContextBuilderService needs; Search/
 * Ranking/Assembler/Indexer stay internal, same "one exported facade"
 * shape AiOrchestratorModule itself uses for AiOrchestratorService.
 */
@Module({
  controllers: [RagController],
  providers: [
    KnowledgeRepository,
    SearchService,
    RankingService,
    KnowledgeAssemblerService,
    KnowledgeRetrievalService,
    RagIndexerService,
  ],
  exports: [KnowledgeRetrievalService],
})
export class RagModule {}

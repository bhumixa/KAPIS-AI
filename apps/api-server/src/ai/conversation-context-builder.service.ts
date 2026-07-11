import { Injectable } from '@nestjs/common';
import { ConversationContextService } from '../conversations/conversation-context.service';
import { ConversationService } from '../conversations/conversation.service';
import { MessageDto } from '../conversations/dto/message.dto';
import { MessageService } from '../conversations/message.service';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeRetrievalService } from '../rag/knowledge-retrieval.service';
import {
  AiConversationContextDto,
  AiPromptSettingsContextDto,
  InsuranceProviderContextDto,
} from './dto/ai-conversation-context.dto';

/** How many most-recent messages ride along in the AI context - enough for a coherent reply without an unbounded prompt. */
const RECENT_MESSAGE_LIMIT = 20;

/**
 * Assembles the single ConversationContext object the AI Orchestration Engine
 * (Sprint 17 brief) needs to draft a reply: everything
 * ConversationContextService (Sprint 16) already builds - conversation,
 * patient, doctor, appointments, clinic profile, business hours, knowledge
 * base - reused as-is (never re-derived), plus the extra pieces prompt
 * building needs that Sprint 16's object didn't: recent message history,
 * internal notes, insurance providers, the AI persona/behavior settings, and,
 * as of Sprint 19, retrievedKnowledge - this is the "Conversation Context
 * Builder calls the Knowledge Retrieval Engine and merges the result into the
 * final AI context" integration point the RAG Engine brief names explicitly.
 * The retrieval query is the patient's last incoming message (same message
 * PromptBuilderService falls back to for `userQuestion` when none is passed
 * explicitly - see its lastIncomingMessage()), derived here from allMessages
 * before it's sliced down to RECENT_MESSAGE_LIMIT. Read-only and recomputed
 * on every call, same as ConversationContextService.
 */
@Injectable()
export class ConversationContextBuilderService {
  constructor(
    private readonly conversationContextService: ConversationContextService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly prisma: PrismaService,
    private readonly knowledgeRetrievalService: KnowledgeRetrievalService,
  ) {}

  async build(conversationId: string): Promise<AiConversationContextDto> {
    const [base, allMessages, internalNotes, insuranceProviders, aiPromptSettings] =
      await Promise.all([
        this.conversationContextService.getContext(conversationId),
        this.messageService.findAll(conversationId),
        this.conversationService.getNotes(conversationId),
        this.getInsuranceProviders(),
        this.getAiPromptSettings(),
      ]);

    const retrievedKnowledge = await this.knowledgeRetrievalService.retrieve(
      this.lastIncomingMessageBody(allMessages),
    );

    return {
      base,
      recentMessages: allMessages.slice(-RECENT_MESSAGE_LIMIT),
      internalNotes,
      insuranceProviders,
      aiPromptSettings,
      retrievedKnowledge,
    };
  }

  private lastIncomingMessageBody(messages: MessageDto[]): string {
    const incoming = [...messages].reverse().find((message) => message.direction === 'incoming');
    return incoming?.body ?? '';
  }

  private async getInsuranceProviders(): Promise<InsuranceProviderContextDto[]> {
    const providers = await this.prisma.insuranceProvider.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
    return providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      phone: provider.phone,
      email: provider.email,
      website: provider.website,
    }));
  }

  // Single-clinic deployment (see docs/Architecture.md) - same singleton-row
  // reasoning `id smallint CHECK (id = 1)` enforces at the schema level.
  private async getAiPromptSettings(): Promise<AiPromptSettingsContextDto | null> {
    const settings = await this.prisma.aiPromptSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      return null;
    }
    return {
      clinicPersonality: settings.clinicPersonality,
      tone: settings.tone,
      greeting: settings.greeting,
      fallbackMessage: settings.fallbackMessage,
      emergencyInstructions: settings.emergencyInstructions,
      escalationRules: settings.escalationRules,
      systemPrompt: settings.systemPrompt,
      enabled: settings.enabled,
    };
  }
}

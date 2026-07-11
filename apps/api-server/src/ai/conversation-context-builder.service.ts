import { Injectable } from '@nestjs/common';
import { ConversationContextService } from '../conversations/conversation-context.service';
import { ConversationService } from '../conversations/conversation.service';
import { MessageService } from '../conversations/message.service';
import { PrismaService } from '../prisma/prisma.service';
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
 * base - reused as-is (never re-derived), plus the four extra pieces prompt
 * building needs that Sprint 16's object didn't: recent message history,
 * internal notes, insurance providers, and the AI persona/behavior settings.
 * Read-only and recomputed on every call, same as ConversationContextService.
 */
@Injectable()
export class ConversationContextBuilderService {
  constructor(
    private readonly conversationContextService: ConversationContextService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly prisma: PrismaService,
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

    return {
      base,
      recentMessages: allMessages.slice(-RECENT_MESSAGE_LIMIT),
      internalNotes,
      insuranceProviders,
      aiPromptSettings,
    };
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

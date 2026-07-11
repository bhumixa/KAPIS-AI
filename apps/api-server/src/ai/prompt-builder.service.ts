import { Injectable } from '@nestjs/common';
import { AiConversationContextDto } from './dto/ai-conversation-context.dto';
import { PromptDto } from './dto/prompt.dto';
import { PromptTemplateDto, PromptTemplateType } from './dto/prompt-template.dto';
import { PromptTemplateService } from './prompt-template.service';

const DEFAULT_TEMPLATE_TYPE: PromptTemplateType = 'general_question';

/** Roughly 4 characters per token - the same order-of-magnitude estimate every provider's docs quote for English text; good enough for a mock preview, not a billing figure. */
const CHARS_PER_TOKEN_ESTIMATE = 4;

const FALLBACK_SYSTEM_PROMPT =
  'You are a helpful AI receptionist for a medical clinic. Be concise, warm, and only use ' +
  'information provided in the context below - never invent appointment times, prices, or ' +
  'medical advice.';

const FALLBACK_USER_PROMPT_TEMPLATE = 'Patient {{patientName}} asked: "{{userQuestion}}"';

/**
 * Builds the final system/user prompt pair - the Sprint 17 brief's
 * PromptBuilderService. Combines a PromptTemplateService template (falling
 * back to a built-in generic template if none is active for the requested
 * type) with every section of AiConversationContextDto: clinic info, doctor
 * info, patient info, conversation history, knowledge base, and message
 * templates. Returns the prompt only - no AI call happens here (see
 * AIExecutionService for the mock call and AIOrchestratorService for how the
 * two are wired together).
 */
@Injectable()
export class PromptBuilderService {
  constructor(private readonly promptTemplateService: PromptTemplateService) {}

  async build(
    context: AiConversationContextDto,
    templateType: PromptTemplateType = DEFAULT_TEMPLATE_TYPE,
    userQuestion?: string,
  ): Promise<PromptDto> {
    const template = await this.promptTemplateService.findActiveByType(templateType);
    const question = userQuestion ?? this.lastIncomingMessage(context) ?? '';

    const variables = this.buildVariables(context, question);
    const systemPrompt = this.composeSystemPrompt(context, template, variables);
    const userPrompt = this.composeUserPrompt(context, template, variables);

    const promptTokenEstimate = Math.ceil(
      (systemPrompt.length + userPrompt.length) / CHARS_PER_TOKEN_ESTIMATE,
    );

    return {
      systemPrompt,
      userPrompt,
      metadata: {
        conversationId: context.base.conversation.id,
        templateType,
        templateId: template?.id ?? null,
        templateName: template?.name ?? 'Fallback (no active template for this type)',
        promptTokenEstimate,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private lastIncomingMessage(context: AiConversationContextDto): string | null {
    const incoming = [...context.recentMessages]
      .reverse()
      .find((message) => message.direction === 'incoming');
    return incoming?.body ?? null;
  }

  private buildVariables(
    context: AiConversationContextDto,
    userQuestion: string,
  ): Record<string, string> {
    const { base } = context;
    return {
      clinicName: base.clinicProfile?.clinicName ?? 'the clinic',
      patientName: `${base.patient.firstName} ${base.patient.lastName}`,
      doctorName: base.doctor
        ? `Dr. ${base.doctor.firstName} ${base.doctor.lastName}`
        : 'the doctor',
      userQuestion,
      upcomingAppointments: base.upcomingAppointments.length
        ? base.upcomingAppointments.map((a) => `${a.date} ${a.startTime}`).join(', ')
        : 'none',
    };
  }

  private applyVariables(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
      template,
    );
  }

  private composeSystemPrompt(
    context: AiConversationContextDto,
    template: PromptTemplateDto | null,
    variables: Record<string, string>,
  ): string {
    const base = this.applyVariables(template?.systemPrompt ?? FALLBACK_SYSTEM_PROMPT, variables);

    const persona = context.aiPromptSettings;
    if (!persona?.enabled) {
      return base;
    }

    const personaLines = [
      persona.tone ? `Tone: ${persona.tone}.` : null,
      persona.clinicPersonality ? `Clinic personality: ${persona.clinicPersonality}` : null,
      persona.escalationRules ? `Escalation rules: ${persona.escalationRules}` : null,
      persona.emergencyInstructions ? `Emergency handling: ${persona.emergencyInstructions}` : null,
    ].filter((line): line is string => Boolean(line));

    return personaLines.length ? `${base}\n\n${personaLines.join('\n')}` : base;
  }

  private composeUserPrompt(
    context: AiConversationContextDto,
    template: PromptTemplateDto | null,
    variables: Record<string, string>,
  ): string {
    const { base } = context;
    const sections: string[] = [];

    if (base.clinicProfile) {
      sections.push(
        [
          '## Clinic Information',
          `Name: ${base.clinicProfile.clinicName}`,
          `Address: ${base.clinicProfile.address}, ${base.clinicProfile.city}, ${base.clinicProfile.state}`,
          `Phone: ${base.clinicProfile.phone}`,
          `Time zone: ${base.clinicProfile.timeZone}`,
        ].join('\n'),
      );
    }

    if (base.doctor) {
      sections.push(
        [
          '## Doctor Information',
          `Name: Dr. ${base.doctor.firstName} ${base.doctor.lastName}`,
          `Specialization: ${base.doctor.specialization}`,
        ].join('\n'),
      );
    }

    sections.push(
      [
        '## Patient Information',
        `Name: ${base.patient.firstName} ${base.patient.lastName}`,
        `Phone: ${base.patient.mobileNumber}`,
        `Upcoming appointments: ${variables['upcomingAppointments']}`,
      ].join('\n'),
    );

    if (context.recentMessages.length) {
      const history = context.recentMessages
        .map(
          (message) =>
            `${message.direction === 'incoming' ? 'Patient' : message.senderName}: ${message.body}`,
        )
        .join('\n');
      sections.push(['## Conversation History', history].join('\n'));
    }

    if (context.internalNotes.length) {
      const notes = context.internalNotes
        .map((note) => `- ${note.authorName}: ${note.body}`)
        .join('\n');
      sections.push(['## Internal Notes (staff only, do not repeat to patient)', notes].join('\n'));
    }

    const knowledgeBase = this.formatKnowledgeBase(context);
    if (knowledgeBase) {
      sections.push(knowledgeBase);
    }

    if (base.knowledgeBase.messageTemplates.length) {
      const templates = base.knowledgeBase.messageTemplates
        .map((t) => `- ${t.name} (${t.type})`)
        .join('\n');
      sections.push(['## Available Message Templates', templates].join('\n'));
    }

    sections.push(
      this.applyVariables(template?.userPromptTemplate ?? FALLBACK_USER_PROMPT_TEMPLATE, variables),
    );

    return sections.join('\n\n');
  }

  private formatKnowledgeBase(context: AiConversationContextDto): string | null {
    const { knowledgeBase } = context.base;
    const parts: string[] = [];

    if (knowledgeBase.faqs.length) {
      parts.push(
        knowledgeBase.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n'),
      );
    }
    if (knowledgeBase.services.length) {
      parts.push(
        `Services: ${knowledgeBase.services.map((s) => `${s.name} (${s.durationMinutes}min, ${s.price})`).join(', ')}`,
      );
    }
    if (knowledgeBase.policies.length) {
      parts.push(
        `Policies: ${knowledgeBase.policies.map((p) => `${p.title}: ${p.content}`).join(' | ')}`,
      );
    }
    if (context.insuranceProviders.length) {
      parts.push(`Accepted insurance: ${context.insuranceProviders.map((p) => p.name).join(', ')}`);
    }

    return parts.length ? ['## Knowledge Base', ...parts].join('\n\n') : null;
  }
}

import { Injectable } from '@nestjs/common';
import { KnowledgeSearchResultDto } from '../rag/dto/knowledge-search-result.dto';
import { AiConversationContextDto } from './dto/ai-conversation-context.dto';
import { COLLECTED_FIELD_KEYS } from './dto/ai-intent.dto';
import { PromptDto } from './dto/prompt.dto';
import { PromptTemplateDto, PromptTemplateType } from './dto/prompt-template.dto';
import { PromptTemplateService } from './prompt-template.service';

const DEFAULT_TEMPLATE_TYPE: PromptTemplateType = 'general_question';

/** Roughly 4 characters per token - the same order-of-magnitude estimate every provider's docs quote for English text; good enough for a mock preview, not a billing figure. */
const CHARS_PER_TOKEN_ESTIMATE = 4;

const FALLBACK_SYSTEM_PROMPT =
  'You are a helpful AI receptionist for a medical clinic. Be concise, warm, and only use ' +
  'information provided in the context below - never invent appointment times, prices, ' +
  'doctors, or medical advice.';

const FALLBACK_USER_PROMPT_TEMPLATE = 'Patient {{patientName}} asked: "{{userQuestion}}"';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Sprint 25 - appended to every system prompt so Gemini returns the
// structured JSON ai/dto/ai-intent.dto.ts and gemini-intent-response.schema.ts
// both expect, instead of a plain-text reply. Kept as one fixed constant
// (not templated) since the intent vocabulary/JSON shape never varies by
// clinic persona or template type - only the "reply" text's tone does.
const JSON_OUTPUT_INSTRUCTION = `
You must respond with ONLY a single JSON object (no markdown, no code fences, no text outside the JSON) matching exactly this shape:
{
  "intent": one of "GENERAL_INQUIRY" | "BOOK_APPOINTMENT" | "RESCHEDULE_APPOINTMENT" | "CANCEL_APPOINTMENT" | "EMERGENCY" | "HANDOFF",
  "confidence": a number from 0 to 1,
  "reply": the message to actually send the patient (warm, concise, natural language - this is the only field they will see),
  "requiresFollowUp": true if you still need more information before this intent can be acted on, false if you have everything needed,
  "missingFields": an array of field names you still need (e.g. ["doctorName", "date"]), empty array if none,
  "collectedFields": { "doctorName": string|null, "date": string|null (YYYY-MM-DD), "time": string|null (24h HH:mm), "reason": string|null, "newDate": string|null, "newTime": string|null, "appointmentReference": string|null, "cancelConfirmed": "true"|"false"|null }
}

Intent guide:
- GENERAL_INQUIRY: questions about hours, doctors, fees, policies, services - answer from context only, requiresFollowUp is always false, collectedFields all null.
- BOOK_APPOINTMENT: the patient wants to book. Collect doctorName, date, time, reason across turns - do not ask again for a field already given in "Conversation State" below. Set requiresFollowUp true and ask exactly one missing field at a time until all four are known, then false.
- RESCHEDULE_APPOINTMENT: collect newDate/newTime for their existing appointment the same way.
- CANCEL_APPOINTMENT: before cancelConfirmed can be "true", you must explicitly ask the patient to confirm and they must say yes - never set it "true" from an ambiguous reply.
- EMERGENCY: chest pain, severe bleeding, difficulty breathing, accidents, or anything urgent - reply with clear guidance to call emergency services or go to the nearest ER immediately. Never set intent to BOOK_APPOINTMENT for an emergency.
- HANDOFF: the patient explicitly asks for a human/staff member, or you cannot confidently help - reply acknowledging a staff member will follow up.
- If nothing above clearly applies, use GENERAL_INQUIRY.

Doctor names: only ever mention a doctor listed in the "## Available Doctors" section below - it is the complete, real list. Never invent a doctor's name, specialization, years of experience, or fee, and never state that a doctor with a given specialty is on staff unless they appear in that list. If nobody in the list matches what the patient is asking for, say so honestly and offer to have a staff member confirm, instead of making one up.
`.trim();

/**
 * Builds the final system/user prompt pair - the Sprint 17 brief's
 * PromptBuilderService. Combines a PromptTemplateService template (falling
 * back to a built-in generic template if none is active for the requested
 * type) with every section of AiConversationContextDto: clinic info, doctor
 * info, patient info, conversation history, and, as of Sprint 19, the RAG
 * Engine's retrievedKnowledge (Relevant Services/FAQs/Policies/Insurance/
 * Doctor Information/Templates - see formatRetrievedKnowledge()) in place of
 * the old "every active FAQ/service/policy row" dump. Returns the prompt
 * only - no AI call happens here (see AIExecutionService for the real AI
 * provider call and AIOrchestratorService for how the two are wired together).
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
      patientName: base.patient
        ? `${base.patient.firstName} ${base.patient.lastName}`
        : base.inquiry?.displayName || 'there',
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
    const personaLines = persona?.enabled
      ? [
          persona.tone ? `Tone: ${persona.tone}.` : null,
          persona.clinicPersonality ? `Clinic personality: ${persona.clinicPersonality}` : null,
          persona.escalationRules ? `Escalation rules: ${persona.escalationRules}` : null,
          persona.emergencyInstructions ? `Emergency handling: ${persona.emergencyInstructions}` : null,
        ].filter((line): line is string => Boolean(line))
      : [];

    const withPersona = personaLines.length ? `${base}\n\n${personaLines.join('\n')}` : base;
    // Sprint 25 - always appended, regardless of template/persona, since the
    // structured-output contract is not optional (WorkflowDispatcherService's
    // decide() depends on every response having intent/collectedFields).
    return `${withPersona}\n\n${this.buildCurrentDateInstruction()}\n\n${JSON_OUTPUT_INSTRUCTION}`;
  }

  // Computed fresh per request (never a static constant, unlike
  // JSON_OUTPUT_INSTRUCTION) - without this, Gemini has no anchor for "today"
  // and resolves relative dates ("day after tomorrow") against whatever date
  // it associates with its own training data, silently producing bookings
  // years in the past. See gemini-response-mapper.service.ts for the
  // matching "must not crash" defensive parsing this pairs with.
  private buildCurrentDateInstruction(): string {
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    const weekday = WEEKDAY_NAMES[now.getUTCDay()];
    return (
      `Current date: ${iso} (${weekday}). Resolve every relative date the patient mentions ` +
      '(today, tomorrow, day after tomorrow, next Monday, etc.) relative to this date - never ' +
      'a year from your own training data.'
    );
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

    // Sprint 25 - the complete active-doctor directory, unconditional on RAG
    // search relevance (see ai-conversation-context.dto.ts's availableDoctors
    // doc comment) - this, not retrievedKnowledge.doctorProfiles, is what
    // JSON_OUTPUT_INSTRUCTION's "Doctor names" rule points the AI at.
    if (context.availableDoctors.length) {
      sections.push(
        [
          '## Available Doctors (the complete, real list - never mention any doctor not listed here)',
          ...context.availableDoctors.map(
            (doctor) =>
              `- Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.specialization}, ` +
              `${doctor.experienceYears} yrs experience, consultation fee $${doctor.consultationFee.toFixed(2)}, ` +
              `${doctor.consultationDuration} min`,
          ),
        ].join('\n'),
      );
    }

    if (base.doctor) {
      sections.push(
        [
          '## Doctor Information (this patient\'s assigned doctor for this conversation)',
          `Name: Dr. ${base.doctor.firstName} ${base.doctor.lastName}`,
          `Specialization: ${base.doctor.specialization}`,
        ].join('\n'),
      );
    }

    if (base.patient) {
      sections.push(
        [
          '## Patient Information',
          `Name: ${base.patient.firstName} ${base.patient.lastName}`,
          `Phone: ${base.patient.mobileNumber}`,
          `Upcoming appointments: ${variables['upcomingAppointments']}`,
        ].join('\n'),
      );
    } else if (base.inquiry) {
      // Sprint 25 - a first-time WhatsApp sender with no patient record yet.
      // Explicitly told not to claim appointment history it doesn't have -
      // upcomingAppointments is always empty for an Inquiry (see
      // ConversationContextService.getContext()).
      sections.push(
        [
          '## Inquiry (Not Yet a Patient)',
          `Name: ${base.inquiry.displayName || 'Unknown'}`,
          `Phone: ${base.inquiry.whatsappNumber}`,
          'This person is not an existing patient yet - do not claim to see appointment history for them. If they want to book, collect the details needed and a patient profile will be created automatically once the booking is confirmed.',
        ].join('\n'),
      );
    }

    const conversationState = this.formatConversationState(base.conversation);
    if (conversationState) {
      sections.push(conversationState);
    }

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

    const retrievedKnowledge = this.formatRetrievedKnowledge(context);
    if (retrievedKnowledge) {
      sections.push(retrievedKnowledge);
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

  // Sprint 25 - renders clinic.conversations.collected_fields/pending_action
  // (the mutable "AI memory" ConversationWorkflowService writes after every
  // turn - see conversation.service.ts's updateAiState()) back into the
  // prompt, so a multi-turn booking never re-asks a field the patient already
  // answered. Returns null when there's nothing known yet (first turn of a
  // fresh GENERAL_INQUIRY conversation).
  private formatConversationState(conversation: AiConversationContextDto['base']['conversation']): string | null {
    const known = COLLECTED_FIELD_KEYS.filter((key) => conversation.collectedFields[key]).map(
      (key) => `${key}: ${conversation.collectedFields[key]}`,
    );
    if (!known.length && !conversation.pendingAction) {
      return null;
    }

    const lines = [
      '## Conversation State (internal - do not repeat verbatim to the patient)',
      ...(known.length ? known : ['(no fields collected yet)']),
      conversation.pendingAction === 'AWAITING_CONFIRMATION'
        ? 'Awaiting the patient\'s explicit yes/no to confirm cancellation.'
        : conversation.pendingAction === 'COLLECTING_FIELDS'
          ? 'Still collecting information before this can be actioned - do not re-ask for any field listed above unless the patient contradicts it.'
          : null,
    ].filter((line): line is string => Boolean(line));

    return lines.join('\n');
  }

  /**
   * Renders the RAG Engine's retrievedKnowledge (Sprint 19) into the six
   * "Relevant ..." sections the brief names verbatim - only items
   * KnowledgeRetrievalService actually matched to the conversation's last
   * incoming message, never the full FAQ/service/policy/etc. tables (that
   * full-dump behavior is what this method replaced - see
   * database/migrations/038_create_fulltext_indexes.sql and
   * rag/knowledge-retrieval.service.ts for how the ranking happens).
   */
  private formatRetrievedKnowledge(context: AiConversationContextDto): string | null {
    const knowledge = context.retrievedKnowledge;
    if (!knowledge) {
      return null;
    }

    const groups: [string, KnowledgeSearchResultDto[]][] = [
      ['Relevant Services', knowledge.services],
      ['Relevant FAQs', knowledge.faqs],
      ['Relevant Policies', knowledge.policies],
      ['Relevant Insurance', knowledge.insuranceProviders],
      ['Relevant Doctor Information', knowledge.doctorProfiles],
      ['Relevant Templates', knowledge.messageTemplates],
    ];

    const sections = groups
      .filter(([, items]) => items.length > 0)
      .map(([heading, items]) =>
        [`## ${heading}`, ...items.map((item) => `- ${item.title}: ${item.snippet}`)].join('\n'),
      );

    return sections.length ? sections.join('\n\n') : null;
  }
}

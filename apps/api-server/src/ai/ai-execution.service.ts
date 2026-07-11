import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiConversationContextDto } from './dto/ai-conversation-context.dto';
import { AiExecutionResultDto } from './dto/ai-execution.dto';
import { PromptDto } from './dto/prompt.dto';

/** Fallback used only if no clinic.ai_models row is seeded yet - see database/seed/003_ai_orchestration_seed.sql. */
const FALLBACK_MODEL = { provider: 'mock', modelName: 'kapis-mock-v1' };

const CHARS_PER_TOKEN_ESTIMATE = 4;
const BASE_LATENCY_MS = 250;
const LATENCY_JITTER_RANGE_MS = 900;

/** One canned reply per prompt template scenario - keyed by templateType, cycled deterministically (never Math.random()) by conversationId so the same context always reproduces the same mock reply. */
const RESPONSE_VARIANTS: Record<string, (patientName: string, doctorName: string) => string[]> = {
  greeting: (patientName) => [
    `Hi ${patientName}! Thanks for reaching out. How can we help you today?`,
    `Hello ${patientName}, welcome back! What can we do for you?`,
  ],
  appointment_booking: (patientName, doctorName) => [
    `Hi ${patientName}, I'd be happy to help you book a visit with ${doctorName}. Could you share a few days that work for you?`,
    `Sure ${patientName} - let's get you scheduled with ${doctorName}. What time of day works best?`,
  ],
  appointment_cancellation: (patientName) => [
    `No problem, ${patientName} - I've noted your request to cancel. Our cancellation policy allows changes up to 4 hours in advance.`,
    `Understood, ${patientName}. I'll take care of cancelling that appointment for you.`,
  ],
  follow_up: (patientName, doctorName) => [
    `Hi ${patientName}, just checking in after your visit with ${doctorName} - how are you feeling?`,
    `Hello ${patientName}, following up on your recent visit. Let us know if you have any questions.`,
  ],
  prescription_reminder: (patientName, doctorName) => [
    `Hi ${patientName}, this is a reminder about your prescription. For clinical questions, ${doctorName} can help.`,
    `Hello ${patientName}, don't forget your refill - reach out if you need anything.`,
  ],
  general_question: (patientName) => [
    `Thanks for your question, ${patientName}! Based on our clinic information, here's what I can share.`,
    `Hi ${patientName}, great question - let me help with that.`,
  ],
  emergency_escalation: (patientName) => [
    `${patientName}, if this is a life-threatening emergency please call emergency services immediately. I'm flagging this conversation for our staff right now.`,
  ],
};

/**
 * Mock-only AI execution - the Sprint 17 brief's AIExecutionService. Never
 * calls Claude/OpenAI/Gemini or any external provider; generates a
 * deterministic fake response (same conversation + template always reproduces
 * the same reply, no Math.random()) so this pipeline can be exercised end to
 * end before a real provider exists. AIOrchestratorService is the only
 * caller.
 */
@Injectable()
export class AiExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    context: AiConversationContextDto,
    prompt: PromptDto,
  ): Promise<AiExecutionResultDto> {
    const model = await this.getDefaultModel();
    const templateType = prompt.metadata.templateType;
    const patientName = `${context.base.patient.firstName} ${context.base.patient.lastName}`;
    const doctorName = context.base.doctor
      ? `Dr. ${context.base.doctor.firstName} ${context.base.doctor.lastName}`
      : 'our team';

    const variants = (RESPONSE_VARIANTS[templateType] ?? RESPONSE_VARIANTS['general_question'])(
      patientName,
      doctorName,
    );
    const response = variants[this.pickIndex(context.base.conversation.id, variants.length)];

    const promptTokens = Math.ceil(
      (prompt.systemPrompt.length + prompt.userPrompt.length) / CHARS_PER_TOKEN_ESTIMATE,
    );
    const completionTokens = Math.ceil(response.length / CHARS_PER_TOKEN_ESTIMATE);

    return {
      response,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: model.modelName,
      provider: model.provider,
      latencyMs: this.deterministicLatency(context.base.conversation.id, promptTokens),
      finishReason: templateType === 'emergency_escalation' ? 'escalated' : 'stop',
    };
  }

  private async getDefaultModel(): Promise<{ provider: string; modelName: string }> {
    const model = await this.prisma.aiModel.findFirst({
      where: { isDefault: true, isActive: true },
    });
    return model ? { provider: model.provider, modelName: model.modelName } : FALLBACK_MODEL;
  }

  /** Stable, non-random index derived from the conversation id's character codes - "deterministic fake responses" per the brief. */
  private pickIndex(conversationId: string, variantCount: number): number {
    const sum = [...conversationId].reduce((total, char) => total + char.charCodeAt(0), 0);
    return sum % variantCount;
  }

  /** Deterministic pseudo-latency: a base plus a value derived from the id/prompt size, never Math.random() or a real timer. */
  private deterministicLatency(conversationId: string, promptTokens: number): number {
    const sum = [...conversationId].reduce((total, char) => total + char.charCodeAt(0), 0);
    return BASE_LATENCY_MS + ((sum + promptTokens) % LATENCY_JITTER_RANGE_MS);
  }
}

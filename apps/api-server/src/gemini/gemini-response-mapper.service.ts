import { Injectable, Logger } from '@nestjs/common';
import {
  AI_INTENTS,
  AiCollectedFields,
  AiIntent,
  COLLECTED_FIELD_KEYS,
  EMPTY_COLLECTED_FIELDS,
} from '../ai/dto/ai-intent.dto';
import { AiProviderResponse } from '../ai/providers/ai-provider.interface';
import { GeminiResponse } from './interfaces/gemini-response.interface';

const PROVIDER_NAME = 'gemini';
const DEFAULT_FINISH_REASON = 'STOP';

// Never surfaced to a customer as raw/partial JSON - used only when the
// response looks like JSON (e.g. truncated by MAX_TOKENS) but not even the
// `reply` field could be salvaged out of it.
const FALLBACK_REPLY_MESSAGE = "Thanks for your message - a team member will follow up with you shortly.";

interface StructuredReply {
  reply: string;
  intent: AiIntent;
  confidence: number;
  requiresFollowUp: boolean;
  missingFields: string[];
  collectedFields: AiCollectedFields;
}

/**
 * Extracts the provider-agnostic AiProviderResponse shape out of Gemini's
 * wire response - the one place that reads `candidates`/`usageMetadata`/
 * `finishReason`, so GeminiProviderService never has to know the
 * generateContent response shape directly.
 *
 * Sprint 25: the raw text is no longer the reply itself - it's JSON matching
 * ai/dto/ai-intent.dto.ts (requested via GeminiProviderService's
 * responseSchema). parseStructuredReply() is the "must not crash the
 * pipeline" guarantee for the whole AI receptionist feature: Gemini violating
 * its own schema, returning plain text, or timing out mid-response are all
 * real failure modes (schema/JSON-mode support isn't 100% guaranteed on every
 * model/request), so any parse or shape failure degrades to a plain
 * GENERAL_INQUIRY reply using the raw text verbatim, rather than throwing.
 */
@Injectable()
export class GeminiResponseMapperService {
  private readonly logger = new Logger(GeminiResponseMapperService.name);

  toReply(response: GeminiResponse): string {
    return (response.candidates ?? [])
      .flatMap((candidate) => candidate.content?.parts ?? [])
      .filter((part) => part.text)
      .map((part) => part.text)
      .join('\n');
  }

  toProviderResponse(response: GeminiResponse, latencyMs: number, fallbackModel: string): AiProviderResponse {
    const structured = this.parseStructuredReply(this.toReply(response));

    return {
      reply: structured.reply,
      model: response.modelVersion ?? fallbackModel,
      provider: PROVIDER_NAME,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      finishReason: response.candidates?.[0]?.finishReason ?? DEFAULT_FINISH_REASON,
      latencyMs,
      intent: structured.intent,
      confidence: structured.confidence,
      requiresFollowUp: structured.requiresFollowUp,
      missingFields: structured.missingFields,
      collectedFields: structured.collectedFields,
    };
  }

  private parseStructuredReply(rawText: string): StructuredReply {
    try {
      const parsed: unknown = JSON.parse(rawText);
      if (this.isValidStructuredReply(parsed)) {
        return {
          reply: parsed.reply,
          intent: parsed.intent,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          requiresFollowUp: Boolean(parsed.requiresFollowUp),
          missingFields: Array.isArray(parsed.missingFields)
            ? parsed.missingFields.filter((field): field is string => typeof field === 'string')
            : [],
          collectedFields: this.toCollectedFields(parsed.collectedFields),
        };
      }
    } catch {
      // Falls through to the plain-text fallback below - JSON.parse failure
      // (truncated response, plain text, markdown code fence, etc.) is an
      // expected, handled case here, not a bug to surface as a 500.
    }

    const looksLikeJson = rawText.trim().startsWith('{');
    const salvagedReply = this.salvageReplyText(rawText);
    const reply = salvagedReply ?? (looksLikeJson ? FALLBACK_REPLY_MESSAGE : rawText);

    this.logger.warn(
      salvagedReply
        ? 'Gemini returned malformed/truncated structured JSON - salvaged the "reply" field and falling back to GENERAL_INQUIRY.'
        : 'Gemini did not return valid structured JSON - falling back to GENERAL_INQUIRY with a safe reply.',
    );
    return {
      reply,
      intent: 'GENERAL_INQUIRY',
      confidence: 0,
      requiresFollowUp: false,
      missingFields: [],
      collectedFields: EMPTY_COLLECTED_FIELDS,
    };
  }

  // Recovers the human-readable `reply` field out of JSON that failed to
  // fully parse (most commonly MAX_TOKENS truncating the response mid-object)
  // - the prompt/schema order the fields so `reply` is emitted early and is
  // usually intact even when later fields (e.g. collectedFields) get cut off.
  // A customer must never see the raw JSON blob, so this is tried before any
  // generic fallback message.
  private salvageReplyText(rawText: string): string | null {
    const match = rawText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      return null;
    }
  }

  private isValidStructuredReply(
    value: unknown,
  ): value is { reply: string; intent: AiIntent; confidence?: unknown; requiresFollowUp?: unknown; missingFields?: unknown; collectedFields?: unknown } {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate['reply'] === 'string' &&
      typeof candidate['intent'] === 'string' &&
      (AI_INTENTS as string[]).includes(candidate['intent'])
    );
  }

  private toCollectedFields(value: unknown): AiCollectedFields {
    if (!value || typeof value !== 'object') {
      return EMPTY_COLLECTED_FIELDS;
    }
    const candidate = value as Record<string, unknown>;
    const result: AiCollectedFields = { ...EMPTY_COLLECTED_FIELDS };
    for (const key of COLLECTED_FIELD_KEYS) {
      const fieldValue = candidate[key];
      if (typeof fieldValue !== 'string') {
        continue;
      }
      if (key === 'cancelConfirmed') {
        result.cancelConfirmed = fieldValue === 'true' ? 'true' : fieldValue === 'false' ? 'false' : null;
      } else {
        result[key] = fieldValue;
      }
    }
    return result;
  }
}

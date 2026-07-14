import { AI_INTENTS } from '../ai/dto/ai-intent.dto';
import { GeminiResponseSchema } from './interfaces/gemini-message.interface';

// Sprint 25 - passed as generationConfig.responseSchema so Gemini returns
// JSON matching ai/dto/ai-intent.dto.ts's AiProviderResponse fields directly,
// instead of us parsing free-form text. GeminiResponseMapperService still
// validates the parsed result defensively (Gemini can violate its own
// schema, or the call can time out before any JSON is produced) - this
// schema reduces how often that happens, it doesn't replace the fallback.
const COLLECTED_FIELDS_SCHEMA: GeminiResponseSchema = {
  type: 'OBJECT',
  properties: {
    doctorName: { type: 'STRING', nullable: true },
    date: { type: 'STRING', nullable: true },
    time: { type: 'STRING', nullable: true },
    reason: { type: 'STRING', nullable: true },
    newDate: { type: 'STRING', nullable: true },
    newTime: { type: 'STRING', nullable: true },
    appointmentReference: { type: 'STRING', nullable: true },
    cancelConfirmed: { type: 'STRING', enum: ['true', 'false'], nullable: true },
  },
  required: [
    'doctorName',
    'date',
    'time',
    'reason',
    'newDate',
    'newTime',
    'appointmentReference',
    'cancelConfirmed',
  ],
};

export const AI_INTENT_RESPONSE_SCHEMA: GeminiResponseSchema = {
  type: 'OBJECT',
  properties: {
    intent: { type: 'STRING', enum: AI_INTENTS },
    confidence: { type: 'NUMBER' },
    reply: { type: 'STRING' },
    requiresFollowUp: { type: 'BOOLEAN' },
    missingFields: { type: 'ARRAY', items: { type: 'STRING' } },
    collectedFields: COLLECTED_FIELDS_SCHEMA,
  },
  required: ['intent', 'confidence', 'reply', 'requiresFollowUp', 'missingFields', 'collectedFields'],
};

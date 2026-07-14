// Sprint 25 - the AI receptionist's intent-classification contract. Gemini
// (via GeminiResponseMapperService.parseStructuredReply()) is instructed to
// return JSON matching this shape instead of a plain-text reply - see
// PromptBuilderService's JSON_OUTPUT_INSTRUCTION and
// gemini/gemini-intent-response.schema.ts for the two ends of the contract.
export type AiIntent =
  | 'GENERAL_INQUIRY'
  | 'BOOK_APPOINTMENT'
  | 'RESCHEDULE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'EMERGENCY'
  | 'HANDOFF';

export const AI_INTENTS: AiIntent[] = [
  'GENERAL_INQUIRY',
  'BOOK_APPOINTMENT',
  'RESCHEDULE_APPOINTMENT',
  'CANCEL_APPOINTMENT',
  'EMERGENCY',
  'HANDOFF',
];

// Booking/reschedule/cancel slot-filling state, accumulated across turns.
// All string|null (not a richer type) so it maps 1:1 onto Gemini's flat JSON
// schema and clinic.conversations.collected_fields (jsonb) without any
// nested-object handling on either end.
export interface AiCollectedFields {
  doctorName: string | null;
  date: string | null;
  time: string | null;
  reason: string | null;
  newDate: string | null;
  newTime: string | null;
  appointmentReference: string | null;
  cancelConfirmed: 'true' | 'false' | null;
}

export const EMPTY_COLLECTED_FIELDS: AiCollectedFields = {
  doctorName: null,
  date: null,
  time: null,
  reason: null,
  newDate: null,
  newTime: null,
  appointmentReference: null,
  cancelConfirmed: null,
};

export const COLLECTED_FIELD_KEYS = Object.keys(EMPTY_COLLECTED_FIELDS) as (keyof AiCollectedFields)[];

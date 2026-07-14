export type GeminiRole = 'user' | 'model';

/** One piece of a `Content` object - only the `text` part type is relevant here (single-turn, no tool use, no inline data). */
export interface GeminiPart {
  text: string;
}

/**
 * One turn in the `contents` array sent to POST /v1beta/models/{model}:generateContent.
 * `role` is omitted entirely for `systemInstruction`, which the Gemini API
 * treats as roleless.
 */
export interface GeminiContent {
  role?: GeminiRole;
  parts: GeminiPart[];
}

// Sprint 25 - Gemini's JSON-mode controls. Only the subset of Gemini's actual
// schema object this codebase needs (OBJECT/STRING/NUMBER/BOOLEAN/ARRAY,
// enum/nullable/items/properties/required) - see gemini-intent-response.schema.ts
// for the one schema built with it.
export interface GeminiResponseSchemaProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  enum?: string[];
  nullable?: boolean;
  items?: GeminiResponseSchemaProperty;
  properties?: Record<string, GeminiResponseSchemaProperty>;
  required?: string[];
}

export type GeminiResponseSchema = GeminiResponseSchemaProperty;

export interface GeminiThinkingConfig {
  thinkingBudget: number;
}

export interface GeminiGenerationConfig {
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: GeminiResponseSchema;
  thinkingConfig?: GeminiThinkingConfig;
}

// Single-turn only: no streaming, no tool use, no history embedded here -
// PromptBuilderService already flattens conversation history into
// `userPrompt` - so `contents` is always exactly one user turn plus the
// top-level `systemInstruction`.
export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  systemInstruction?: GeminiContent;
  generationConfig?: GeminiGenerationConfig;
}

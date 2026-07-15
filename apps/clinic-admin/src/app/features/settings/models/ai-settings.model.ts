export type AIProvider = 'gemini' | 'openai';

export const AI_PROVIDERS: readonly AIProvider[] = ['gemini', 'openai'];

/**
 * Placeholder only - Sprint 6 stores these fields but makes no API calls.
 * API keys are never editable here - they're env-only
 * (GEMINI_API_KEY/OPENAI_API_KEY on the backend), the same convention Google
 * Calendar's connection page uses for its OAuth client credentials.
 */
export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  defaultModel: string;
  systemPrompt: string;
  /** 0-1, matches the Gemini/OpenAI API's own temperature range. */
  temperature: number;
  maxTokens: number;
  updatedAt: string;
}

export type AISettingsInput = Omit<AISettings, 'updatedAt'>;

export type AIProvider = 'claude' | 'openai';

export const AI_PROVIDERS: readonly AIProvider[] = ['claude', 'openai'];

/**
 * Placeholder only - Sprint 6 stores these fields but makes no API calls.
 * Real key storage/encryption is a later-sprint concern once an AI module
 * actually consumes them.
 */
export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  claudeApiKey: string;
  openaiApiKey: string;
  defaultModel: string;
  systemPrompt: string;
  /** 0-1, matches the Claude/OpenAI API's own temperature range. */
  temperature: number;
  maxTokens: number;
  updatedAt: string;
}

export type AISettingsInput = Omit<AISettings, 'updatedAt'>;

/** Single-row configuration for the future AI receptionist's persona. Placeholder only - nothing here calls an AI provider yet (that's `settings/models/ai-settings.model.ts`, which holds the provider/API-key config). */
export interface AIPromptSettings {
  clinicPersonality: string;
  tone: string;
  greeting: string;
  fallbackMessage: string;
  emergencyInstructions: string;
  escalationRules: string;
  systemPrompt: string;
  enabled: boolean;
  updatedAt: string;
}

export type AIPromptSettingsInput = Omit<AIPromptSettings, 'updatedAt'>;

import { IntegrationStatus } from './integration-status.model';

/**
 * Claude API configuration - placeholder only, no Anthropic API calls are made.
 * The API key is never editable here - it's env-only (GEMINI_API_KEY on the backend).
 */
export interface ClaudeIntegration {
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  status: IntegrationStatus;
  updatedAt: string;
}

export type ClaudeIntegrationInput = Omit<ClaudeIntegration, 'status' | 'updatedAt'>;

import { IntegrationStatus } from './integration-status.model';

/** Claude API configuration - placeholder only, no Anthropic API calls are made. */
export interface ClaudeIntegration {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  status: IntegrationStatus;
  updatedAt: string;
}

export type ClaudeIntegrationInput = Omit<ClaudeIntegration, 'status' | 'updatedAt'>;

/**
 * The provider-agnostic port the AI Orchestration Engine's execution seam
 * (AiExecutionService) depends on - the Sprint 18 brief's "AIOrchestratorService
 * must depend only on AiProvider, never directly on the concrete provider".
 * `GeminiProviderService` (apps/api-server/src/gemini/) is the only
 * implementation today (Sprint 24); a future OpenAI/Azure/Ollama provider
 * plugs in by implementing this interface and rebinding the AI_PROVIDER
 * token in AiOrchestratorModule - nothing in ai/ needs to change.
 */

import { AiCollectedFields, AiIntent } from '../dto/ai-intent.dto';

/** Injection token for the bound AiProvider implementation - see AiOrchestratorModule. */
export const AI_PROVIDER = 'AI_PROVIDER';

export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
}

// Sprint 25 - intent/confidence/requiresFollowUp/missingFields/collectedFields
// are the AI receptionist's structured-output contract (see
// ai/dto/ai-intent.dto.ts). Every AiProvider implementation must fill these,
// even a provider with no native JSON mode - GeminiResponseMapperService
// shows the reference pattern: parse-or-fall-back-to-GENERAL_INQUIRY, never
// throw on a malformed response.
export interface AiProviderResponse {
  reply: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  finishReason: string;
  latencyMs: number;
  intent: AiIntent;
  confidence: number;
  requiresFollowUp: boolean;
  missingFields: string[];
  collectedFields: AiCollectedFields;
}

export interface AiProviderHealth {
  configured: boolean;
  reachable: boolean;
  model: string;
  provider: string;
}

/** Cheap, synchronous descriptor - no network call. Used to label a failed execution with the provider that was attempted. */
export interface AiProviderInfo {
  provider: string;
  model: string;
}

export interface AiProvider {
  getInfo(): AiProviderInfo;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
  checkHealth(): Promise<AiProviderHealth>;
}

/**
 * The provider-agnostic port the AI Orchestration Engine's execution seam
 * (AiExecutionService) depends on - the Sprint 18 brief's "AIOrchestratorService
 * must depend only on AiProvider, never directly on Claude". `ClaudeProviderService`
 * (apps/api-server/src/claude/) is the only implementation today; a future
 * OpenAI/Gemini/Azure/Ollama provider plugs in by implementing this interface
 * and rebinding the AI_PROVIDER token in AiOrchestratorModule - nothing in
 * ai/ needs to change.
 */

/** Injection token for the bound AiProvider implementation - see AiOrchestratorModule. */
export const AI_PROVIDER = 'AI_PROVIDER';

export interface AiProviderRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface AiProviderResponse {
  reply: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  finishReason: string;
  latencyMs: number;
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

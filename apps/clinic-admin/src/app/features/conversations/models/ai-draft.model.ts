export type AIDraftStatus = 'idle' | 'generating' | 'ready';

/**
 * Client-side-only view state for the AI Draft Panel - never persisted and
 * never sent to a real AI API (Sprint 9 is mock-only, same boundary
 * `AIPromptSettings.enabled` draws in Knowledge Base). A draft becomes a real
 * `Message` only once "Accept Draft" sends it through `MessageService`.
 */
export interface AIDraft {
  status: AIDraftStatus;
  content: string;
  generatedAt: string | null;
}

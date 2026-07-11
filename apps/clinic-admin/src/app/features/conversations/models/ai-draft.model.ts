export type AIDraftStatus = 'idle' | 'loading-context' | 'context-ready' | 'generating' | 'ready';

/**
 * Client-side-only view state for the AI Draft Panel. Sprint 17 replaced the
 * canned-template mock with real calls to apps/api-server's AIOrchestratorModule
 * (still mock-only server-side - see AIExecutionService, no external AI API is
 * ever called). A draft becomes a real `Message` only once "Accept Draft"
 * sends it through `MessageService`.
 */
export interface AIDraft {
  status: AIDraftStatus;
  content: string;
  generatedAt: string | null;
}

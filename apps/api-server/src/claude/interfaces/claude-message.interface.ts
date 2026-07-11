export type ClaudeRole = 'user' | 'assistant';

/** One turn in the `messages` array sent to POST /v1/messages. */
export interface ClaudeMessage {
  role: ClaudeRole;
  content: string;
}

// Single-turn only (per the Sprint 18 brief: no streaming, no tool use, no
// history embedded here - PromptBuilderService already flattens conversation
// history into `userPrompt`), so this is always exactly one user message plus
// the top-level `system` string.
export interface ClaudeMessagesRequest {
  model: string;
  max_tokens: number;
  temperature?: number;
  system?: string;
  messages: ClaudeMessage[];
}

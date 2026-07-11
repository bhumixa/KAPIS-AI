import { ClaudeUsage } from './claude-usage.interface';

// Only the `text` content block type is relevant here (single-turn, no tool
// use per the brief) - `input` is omitted since a tool_use block never occurs.
export interface ClaudeContentBlock {
  type: string;
  text?: string;
}

/** Field-for-field mirror of the Anthropic Messages API's response body. */
export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: ClaudeContentBlock[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: ClaudeUsage;
}

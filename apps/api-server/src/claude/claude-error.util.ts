import { AxiosError } from 'axios';

/**
 * Structured error for a failed Claude API call - carries enough for
 * AiOrchestratorService to log a meaningful failure (status/errorType/message)
 * without leaking the request itself (headers, which carry ANTHROPIC_API_KEY,
 * are never read here).
 */
export class ClaudeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly errorType: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

/**
 * Turns any error a call to the Claude API can throw into a ClaudeApiError -
 * never reads request headers (which carry ANTHROPIC_API_KEY) or a raw stack
 * trace, only the response body Anthropic itself returned and axios's own
 * (header-free) network-error message. Mirrors describeN8nError's shape
 * (apps/api-server/src/n8n/n8n-error.util.ts) but returns a typed error
 * instead of a string, since callers here need `status`/`retryable` to decide
 * how to log and whether a retry would help.
 */
export function describeClaudeError(error: unknown): ClaudeApiError {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ClaudeApiError('Timed out waiting for Claude to respond.', null, 'timeout', true);
    }
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as
        { error?: { type?: string; message?: string } } | undefined;
      const errorType = body?.error?.type ?? 'api_error';
      const detail = body?.error?.message ?? error.response.statusText;
      const retryable = status === 429 || status >= 500;
      return new ClaudeApiError(
        `Claude API responded with ${status} (${errorType}): ${detail}`,
        status,
        errorType,
        retryable,
      );
    }
    return new ClaudeApiError(
      `Could not reach the Claude API: ${error.message}`,
      null,
      'network_error',
      true,
    );
  }
  if (error instanceof Error) {
    return new ClaudeApiError(error.message, null, 'unknown_error', false);
  }
  return new ClaudeApiError('Unknown error calling the Claude API.', null, 'unknown_error', false);
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true;
}

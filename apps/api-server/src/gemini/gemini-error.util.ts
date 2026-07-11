import { AxiosError } from 'axios';

/**
 * Structured error for a failed Gemini API call - carries enough for
 * AiOrchestratorService to log a meaningful failure (status/errorType/message)
 * without leaking the request itself (headers, which carry GEMINI_API_KEY,
 * are never read here).
 */
export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly errorType: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

/**
 * Turns any error a call to the Gemini API can throw into a GeminiApiError -
 * never reads request headers (which carry GEMINI_API_KEY) or a raw stack
 * trace, only the response body Google itself returned and axios's own
 * (header-free) network-error message. Mirrors describeN8nError's shape
 * (apps/api-server/src/n8n/n8n-error.util.ts) but returns a typed error
 * instead of a string, since callers here need `status`/`retryable` to decide
 * how to log and whether a retry would help.
 */
export function describeGeminiError(error: unknown): GeminiApiError {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new GeminiApiError('Timed out waiting for Gemini to respond.', null, 'timeout', true);
    }
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as
        { error?: { status?: string; message?: string } } | undefined;
      const errorType = body?.error?.status ?? 'api_error';
      const detail = body?.error?.message ?? error.response.statusText;
      const retryable = status === 429 || status >= 500;
      return new GeminiApiError(
        `Gemini API responded with ${status} (${errorType}): ${detail}`,
        status,
        errorType,
        retryable,
      );
    }
    return new GeminiApiError(
      `Could not reach the Gemini API: ${error.message}`,
      null,
      'network_error',
      true,
    );
  }
  if (error instanceof Error) {
    return new GeminiApiError(error.message, null, 'unknown_error', false);
  }
  return new GeminiApiError('Unknown error calling the Gemini API.', null, 'unknown_error', false);
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true;
}

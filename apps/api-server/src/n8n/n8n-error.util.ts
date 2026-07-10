import { AxiosError } from 'axios';

/**
 * Turns any error a call to n8n can throw into a short, safe-to-return message -
 * never leaks request headers (which may carry N8N_API_KEY) or a raw stack trace
 * to the API caller. Used by both the trigger flow (which swallows this into a
 * 'failed' execution) and the import flow (which surfaces it as an HTTP error).
 */
export function describeN8nError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Timed out waiting for n8n to respond.';
    }
    if (error.response) {
      const body = error.response.data;
      const detail =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message: unknown }).message)
          : error.response.statusText;
      return `n8n responded with ${error.response.status}: ${detail}`;
    }
    return `Could not reach n8n: ${error.message}`;
  }
  return error instanceof Error ? error.message : 'Unknown error calling n8n.';
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true;
}

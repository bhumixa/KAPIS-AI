import { AxiosError } from 'axios';

/**
 * Structured error for a failed WhatsApp Cloud API call - mirrors
 * ClaudeApiError's shape (apps/api-server/src/claude/claude-error.util.ts).
 * Never reads request headers (which carry WHATSAPP_ACCESS_TOKEN).
 */
export class WhatsappApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly errorType: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'WhatsappApiError';
  }
}

/**
 * Turns any error a call to the WhatsApp Cloud API can throw into a
 * WhatsappApiError - reads only the response body Meta returned (Graph API
 * errors are shaped `{ error: { message, type, code } }`) and axios's own
 * (header-free) network-error message.
 */
export function describeWhatsappError(error: unknown): WhatsappApiError {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new WhatsappApiError(
        'Timed out waiting for the WhatsApp Cloud API to respond.',
        null,
        'timeout',
        true,
      );
    }
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as
        | { error?: { type?: string; message?: string; code?: number } }
        | undefined;
      const errorType = body?.error?.type ?? 'api_error';
      const detail = body?.error?.message ?? error.response.statusText;
      const retryable = status === 429 || status >= 500;
      return new WhatsappApiError(
        `WhatsApp Cloud API responded with ${status} (${errorType}): ${detail}`,
        status,
        errorType,
        retryable,
      );
    }
    return new WhatsappApiError(
      `Could not reach the WhatsApp Cloud API: ${error.message}`,
      null,
      'network_error',
      true,
    );
  }
  if (error instanceof Error) {
    return new WhatsappApiError(error.message, null, 'unknown_error', false);
  }
  return new WhatsappApiError('Unknown error calling the WhatsApp Cloud API.', null, 'unknown_error', false);
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true;
}

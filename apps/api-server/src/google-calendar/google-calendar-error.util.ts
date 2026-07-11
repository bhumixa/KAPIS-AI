import { AxiosError } from 'axios';

/**
 * Structured error for a failed Google OAuth/Calendar API call - mirrors
 * WhatsappApiError's shape (apps/api-server/src/whatsapp/whatsapp-error.util.ts).
 * Never reads request headers (which carry the OAuth access token).
 */
export class GoogleCalendarApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly errorType: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'GoogleCalendarApiError';
  }
}

/**
 * Turns any error a call to Google's OAuth/Calendar API can throw into a
 * GoogleCalendarApiError - reads only the response body Google returned
 * (errors are shaped `{ error: string, error_description: string }` for
 * OAuth or `{ error: { code, message, errors } }` for the Calendar API) and
 * axios's own (header-free) network-error message.
 */
export function describeGoogleCalendarError(error: unknown): GoogleCalendarApiError {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new GoogleCalendarApiError(
        'Timed out waiting for Google to respond.',
        null,
        'timeout',
        true,
      );
    }
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as
        | { error?: string | { code?: number; message?: string }; error_description?: string }
        | undefined;
      const errorType =
        typeof body?.error === 'string' ? body.error : 'api_error';
      const detail =
        (typeof body?.error === 'object' ? body.error?.message : undefined) ??
        body?.error_description ??
        error.response.statusText;
      const retryable = status === 429 || status >= 500;
      return new GoogleCalendarApiError(
        `Google responded with ${status} (${errorType}): ${detail}`,
        status,
        errorType,
        retryable,
      );
    }
    return new GoogleCalendarApiError(`Could not reach Google: ${error.message}`, null, 'network_error', true);
  }
  if (error instanceof Error) {
    return new GoogleCalendarApiError(error.message, null, 'unknown_error', false);
  }
  return new GoogleCalendarApiError('Unknown error calling Google.', null, 'unknown_error', false);
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError === true;
}

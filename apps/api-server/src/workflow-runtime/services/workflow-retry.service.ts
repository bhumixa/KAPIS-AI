import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

export interface RetryOptions {
  /** Called before each retry attempt (not the first try) - lets the caller log/persist the failure. */
  onRetry?: (attempt: number, error: Error) => void | Promise<void>;
}

/**
 * Wraps a single pipeline step (an AI call, a WhatsApp send, an n8n trigger)
 * with capped, exponentially-backed-off retries - the Sprint 21 brief's
 * "Retry: network failures, temporary AI failures, n8n timeouts. No
 * infinite retries." Generic so ConversationWorkflowService/
 * WorkflowDispatcherService reuse the same policy for every retryable step
 * instead of each hand-rolling their own retry loop.
 */
@Injectable()
export class WorkflowRetryService {
  private readonly logger = new Logger(WorkflowRetryService.name);
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig['workflowRuntime']>('app.workflowRuntime')!;
    this.maxAttempts = config.maxRetryAttempts;
    this.baseDelayMs = config.retryDelayMs;
  }

  async run<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    let lastError: Error = new Error('Retry never attempted the wrapped step.');

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isLastAttempt = attempt === this.maxAttempts;
        this.logger.warn(`Attempt ${attempt}/${this.maxAttempts} failed: ${lastError.message}`);

        if (isLastAttempt) {
          break;
        }

        await options.onRetry?.(attempt, lastError);
        await this.delay(this.baseDelayMs * 2 ** (attempt - 1));
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

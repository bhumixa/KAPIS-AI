import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks in-flight HTTP requests via a counter (rather than a boolean) so
 * overlapping requests don't cause one finishing early to hide the spinner
 * while others are still pending.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _activeRequests = signal(0);
  readonly isLoading = computed(() => this._activeRequests() > 0);

  show(): void {
    this._activeRequests.update((count) => count + 1);
  }

  hide(): void {
    this._activeRequests.update((count) => Math.max(0, count - 1));
  }
}

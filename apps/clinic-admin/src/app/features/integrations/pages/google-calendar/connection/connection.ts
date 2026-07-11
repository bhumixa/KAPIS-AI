import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleCalendarService } from '../../../services/google-calendar.service';
import { GoogleCalendarNav } from '../../../components/google-calendar-nav/google-calendar-nav';
import { IntegrationStatusChip } from '../../../components/integration-status-chip/integration-status-chip';

/**
 * Sprint 22 - the real OAuth 2.0 connect/disconnect/refresh-token flow,
 * replacing the Sprint 8 placeholder form (client id/secret/redirect URL
 * were never real inputs here - Google's own consent screen owns that,
 * driven by the already-configured GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI on
 * the backend; see GoogleCalendarService.getAuthUrl()). Reads
 * ?connected=&error= off the URL once - GoogleCalendarController's
 * GET /oauth/callback redirects the browser back here with those params
 * after exchanging the authorization code.
 */
@Component({
  selector: 'app-google-calendar-connection',
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    GoogleCalendarNav,
    IntegrationStatusChip,
  ],
  templateUrl: './connection.html',
  styleUrl: './connection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Connection {
  private readonly googleCalendarService = inject(GoogleCalendarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly connection = this.googleCalendarService.connection;

  readonly isDisconnecting = signal(false);
  readonly isRefreshing = signal(false);

  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: null });

  constructor() {
    effect(() => {
      const params = this.queryParams();
      if (!params || !params.has('connected')) {
        return;
      }
      const connected = params.get('connected') === 'true';
      const error = params.get('error');
      this.snackBar.open(
        connected ? 'Google Calendar connected.' : `Could not connect Google Calendar${error ? `: ${error}` : '.'}`,
        'Dismiss',
        { duration: 5000 },
      );
      this.googleCalendarService.getConnection().subscribe();
      void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    });
  }

  connect(): void {
    this.googleCalendarService.connect();
  }

  disconnect(): void {
    if (this.isDisconnecting()) {
      return;
    }
    this.isDisconnecting.set(true);
    this.googleCalendarService.disconnect().subscribe({
      next: () => {
        this.isDisconnecting.set(false);
        this.snackBar.open('Google Calendar disconnected.', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.isDisconnecting.set(false);
        this.snackBar.open('Could not disconnect Google Calendar.', 'Dismiss', { duration: 3000 });
      },
    });
  }

  refreshToken(): void {
    if (this.isRefreshing()) {
      return;
    }
    this.isRefreshing.set(true);
    this.googleCalendarService.refreshToken().subscribe({
      next: () => {
        this.isRefreshing.set(false);
        this.snackBar.open('Access token refreshed.', 'Dismiss', { duration: 3000 });
      },
      error: (error: HttpErrorResponse) => {
        this.isRefreshing.set(false);
        const message = (error.error as { message?: string } | null)?.message;
        this.snackBar.open(message ?? 'Could not refresh the access token.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { GoogleCalendarService } from '../../../services/google-calendar.service';
import { GoogleCalendarNav } from '../../../components/google-calendar-nav/google-calendar-nav';

/** Sprint 22 - append-only trace of every CREATE/UPDATE/DELETE/NOTIFY attempt (clinic.google_calendar_sync_events, GoogleCalendarSyncService/GoogleCalendarWebhookService), same Recent-Executions table shape AutomationDashboard already uses for workflow runs. */
@Component({
  selector: 'app-google-calendar-sync-history',
  imports: [DatePipe, MatButtonModule, MatChipsModule, MatIconModule, MatTableModule, GoogleCalendarNav],
  templateUrl: './sync-history.html',
  styleUrl: './sync-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncHistory {
  private readonly googleCalendarService = inject(GoogleCalendarService);

  readonly syncHistory = this.googleCalendarService.syncHistory;
  readonly isRefreshing = signal(false);

  readonly columns = ['operation', 'appointmentId', 'googleEventId', 'status', 'syncedAt', 'errorMessage'];

  refresh(): void {
    if (this.isRefreshing()) {
      return;
    }
    this.isRefreshing.set(true);
    this.googleCalendarService.getSyncHistory().subscribe(() => this.isRefreshing.set(false));
  }
}

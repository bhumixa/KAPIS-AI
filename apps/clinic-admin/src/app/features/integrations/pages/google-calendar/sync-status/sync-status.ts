import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { GoogleCalendarService } from '../../../services/google-calendar.service';
import { GoogleCalendarNav } from '../../../components/google-calendar-nav/google-calendar-nav';

/** Sprint 22 - live health (connected/calendarId/lastSync/provider) and today's sync counts, same health-chip + stat-card shapes AutomationDashboard already established. */
@Component({
  selector: 'app-google-calendar-sync-status',
  imports: [DatePipe, MatCardModule, MatChipsModule, GoogleCalendarNav],
  templateUrl: './sync-status.html',
  styleUrl: './sync-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncStatus {
  private readonly googleCalendarService = inject(GoogleCalendarService);

  readonly health = this.googleCalendarService.health;
  readonly stats = this.googleCalendarService.stats;

  readonly healthChips = computed(() => {
    const health = this.health();
    if (!health) {
      return null;
    }
    return [
      { label: health.connected ? 'Connected' : 'Not connected', ok: health.connected },
      { label: `Provider: ${health.provider}`, ok: true },
      { label: health.calendarId ? `Calendar: ${health.calendarId}` : 'No calendar', ok: !!health.calendarId },
    ];
  });
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

interface GoogleCalendarNavLink {
  label: string;
  path: string;
  exact: boolean;
}

const BASE = `${ROUTE_PATHS.INTEGRATIONS}/google-calendar`;

/** Sub-nav for the Google Calendar section's four Sprint 22 pages - same tab shape IntegrationsNav uses one level up. */
@Component({
  selector: 'app-google-calendar-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './google-calendar-nav.html',
  styleUrl: './google-calendar-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleCalendarNav {
  readonly links: GoogleCalendarNavLink[] = [
    { label: 'Connection', path: BASE, exact: true },
    { label: 'Sync Status', path: `${BASE}/sync-status`, exact: false },
    { label: 'Sync History', path: `${BASE}/sync-history`, exact: false },
    { label: 'Manual Sync', path: `${BASE}/manual-sync`, exact: false },
  ];
}

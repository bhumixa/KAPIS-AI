import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

interface SettingsNavLink {
  label: string;
  path: string;
  exact: boolean;
}

/** Small sub-nav shared by all eight settings screens, same shape as `ScheduleNav`. */
@Component({
  selector: 'app-settings-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './settings-nav.html',
  styleUrl: './settings-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsNav {
  readonly links: SettingsNavLink[] = [
    { label: 'Clinic Profile', path: `${ROUTE_PATHS.SETTINGS}`, exact: true },
    { label: 'Business Hours', path: `${ROUTE_PATHS.SETTINGS}/business-hours`, exact: false },
    {
      label: 'Appointment Settings',
      path: `${ROUTE_PATHS.SETTINGS}/appointment-settings`,
      exact: false,
    },
    { label: 'User Management', path: `${ROUTE_PATHS.SETTINGS}/users`, exact: false },
    {
      label: 'Roles & Permissions',
      path: `${ROUTE_PATHS.SETTINGS}/roles-permissions`,
      exact: false,
    },
    { label: 'AI Settings', path: `${ROUTE_PATHS.SETTINGS}/ai-settings`, exact: false },
    {
      label: 'WhatsApp Settings',
      path: `${ROUTE_PATHS.SETTINGS}/whatsapp-settings`,
      exact: false,
    },
    {
      label: 'Notification Settings',
      path: `${ROUTE_PATHS.SETTINGS}/notification-settings`,
      exact: false,
    },
  ];
}

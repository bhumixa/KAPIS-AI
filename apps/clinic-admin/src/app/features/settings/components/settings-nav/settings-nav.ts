import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/user.model';

interface SettingsNavLink {
  label: string;
  path: string;
  exact: boolean;
  /** Omitted means visible to every role; otherwise only shown to the roles listed. */
  roles?: UserRole[];
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
  private readonly authService = inject(AuthService);

  private readonly allLinks: SettingsNavLink[] = [
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
      roles: ['developer'],
    },
    {
      label: 'AI Settings',
      path: `${ROUTE_PATHS.SETTINGS}/ai-settings`,
      exact: false,
      roles: ['developer'],
    },
    {
      label: 'WhatsApp Settings',
      path: `${ROUTE_PATHS.SETTINGS}/whatsapp-settings`,
      exact: false,
      roles: ['developer'],
    },
    {
      label: 'Notification Settings',
      path: `${ROUTE_PATHS.SETTINGS}/notification-settings`,
      exact: false,
    },
  ];

  readonly links = computed(() => {
    const role = this.authService.currentUser()?.role;
    return this.allLinks.filter((link) => !link.roles || (!!role && link.roles.includes(role)));
  });
}

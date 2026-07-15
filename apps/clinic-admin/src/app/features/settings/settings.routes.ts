import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clinic-profile/clinic-profile').then((m) => m.ClinicProfilePage),
    data: { breadcrumb: 'Clinic Profile' },
  },
  {
    path: 'business-hours',
    loadComponent: () =>
      import('./pages/business-hours/business-hours').then((m) => m.BusinessHoursPage),
    data: { breadcrumb: 'Business Hours' },
  },
  {
    path: 'appointment-settings',
    loadComponent: () =>
      import('./pages/appointment-settings/appointment-settings').then(
        (m) => m.AppointmentSettingsPage,
      ),
    data: { breadcrumb: 'Appointment Settings' },
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/user-management/user-management').then((m) => m.UserManagement),
    data: { breadcrumb: 'User Management' },
  },
  {
    path: 'roles-permissions',
    canActivate: [roleGuard('developer')],
    loadComponent: () =>
      import('./pages/roles-permissions/roles-permissions').then((m) => m.RolesPermissions),
    data: { breadcrumb: 'Roles & Permissions' },
  },
  {
    path: 'ai-settings',
    canActivate: [roleGuard('developer')],
    loadComponent: () => import('./pages/ai-settings/ai-settings').then((m) => m.AiSettingsPage),
    data: { breadcrumb: 'AI Settings' },
  },
  {
    path: 'whatsapp-settings',
    canActivate: [roleGuard('developer')],
    loadComponent: () =>
      import('./pages/whatsapp-settings/whatsapp-settings').then((m) => m.WhatsAppSettingsPage),
    data: { breadcrumb: 'WhatsApp Settings' },
  },
  {
    path: 'notification-settings',
    loadComponent: () =>
      import('./pages/notification-settings/notification-settings').then(
        (m) => m.NotificationSettingsPage,
      ),
    data: { breadcrumb: 'Notification Settings' },
  },
];

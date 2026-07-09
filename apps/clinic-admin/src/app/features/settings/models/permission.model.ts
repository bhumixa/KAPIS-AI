import { UserRole } from '../../../core/models/user.model';

export type PermissionModule =
  | 'dashboard'
  | 'doctors'
  | 'patients'
  | 'appointments'
  | 'schedule'
  | 'settings'
  | 'ai'
  | 'whatsapp'
  | 'reports';

export const PERMISSION_MODULES: readonly PermissionModule[] = [
  'dashboard',
  'doctors',
  'patients',
  'appointments',
  'schedule',
  'settings',
  'ai',
  'whatsapp',
  'reports',
];

export const PERMISSION_MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  doctors: 'Doctors',
  patients: 'Patients',
  appointments: 'Appointments',
  schedule: 'Schedule',
  settings: 'Settings',
  ai: 'AI',
  whatsapp: 'WhatsApp',
  reports: 'Reports',
};

export interface PermissionActions {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

/**
 * The reusable permission model requested by Sprint 6: one row per
 * (role, module), each carrying its own View/Create/Update/Delete flags -
 * the same "one row per (entity, category)" shape `doctor_schedules`
 * established in Sprint 3, rather than a JSON blob per role.
 */
export interface RolePermission {
  role: UserRole;
  module: PermissionModule;
  actions: PermissionActions;
}

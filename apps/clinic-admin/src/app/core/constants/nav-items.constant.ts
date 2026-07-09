import { NavItem } from '../models/nav-item.model';
import { ROUTE_PATHS } from './route-paths.constant';

/** Sidenav configuration. Adding a feature area later only means adding a line here. */
export const SIDENAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: ROUTE_PATHS.DASHBOARD },
  {
    label: 'Doctors',
    icon: 'medical_services',
    children: [
      { label: 'Doctor List', icon: 'list', route: ROUTE_PATHS.DOCTORS, exactMatch: true },
      {
        label: 'Doctor Schedule',
        icon: 'event_available',
        route: `${ROUTE_PATHS.DOCTORS}/schedule`,
      },
    ],
  },
  { label: 'Patients', icon: 'groups', route: ROUTE_PATHS.PATIENTS },
  {
    label: 'Appointments',
    icon: 'event',
    children: [
      {
        label: 'Appointment List',
        icon: 'list',
        route: ROUTE_PATHS.APPOINTMENTS,
        exactMatch: true,
      },
      {
        label: 'Book Appointment',
        icon: 'add_circle',
        route: `${ROUTE_PATHS.APPOINTMENTS}/book`,
      },
      {
        label: 'Calendar View',
        icon: 'calendar_month',
        route: `${ROUTE_PATHS.APPOINTMENTS}/calendar`,
      },
      {
        label: 'Daily Schedule',
        icon: 'today',
        route: `${ROUTE_PATHS.APPOINTMENTS}/daily-schedule`,
      },
    ],
  },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      {
        label: 'Clinic Profile',
        icon: 'storefront',
        route: ROUTE_PATHS.SETTINGS,
        exactMatch: true,
      },
      {
        label: 'Business Hours',
        icon: 'schedule',
        route: `${ROUTE_PATHS.SETTINGS}/business-hours`,
      },
      {
        label: 'Appointment Settings',
        icon: 'event_note',
        route: `${ROUTE_PATHS.SETTINGS}/appointment-settings`,
      },
      {
        label: 'User Management',
        icon: 'manage_accounts',
        route: `${ROUTE_PATHS.SETTINGS}/users`,
      },
      {
        label: 'Roles & Permissions',
        icon: 'admin_panel_settings',
        route: `${ROUTE_PATHS.SETTINGS}/roles-permissions`,
      },
      {
        label: 'AI Settings',
        icon: 'smart_toy',
        route: `${ROUTE_PATHS.SETTINGS}/ai-settings`,
      },
      {
        label: 'WhatsApp Settings',
        icon: 'chat',
        route: `${ROUTE_PATHS.SETTINGS}/whatsapp-settings`,
      },
      {
        label: 'Notification Settings',
        icon: 'notifications',
        route: `${ROUTE_PATHS.SETTINGS}/notification-settings`,
      },
    ],
  },
];

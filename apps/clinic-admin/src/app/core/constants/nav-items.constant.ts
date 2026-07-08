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
  { label: 'Settings', icon: 'settings', route: ROUTE_PATHS.SETTINGS },
];

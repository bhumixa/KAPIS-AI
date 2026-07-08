import { NavItem } from '../models/nav-item.model';
import { ROUTE_PATHS } from './route-paths.constant';

/** Sidenav configuration. Adding a feature area later only means adding a line here. */
export const SIDENAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: ROUTE_PATHS.DASHBOARD },
  { label: 'Doctors', icon: 'medical_services', route: ROUTE_PATHS.DOCTORS },
  { label: 'Patients', icon: 'groups', route: ROUTE_PATHS.PATIENTS },
  { label: 'Appointments', icon: 'event', route: ROUTE_PATHS.APPOINTMENTS },
  { label: 'Settings', icon: 'settings', route: ROUTE_PATHS.SETTINGS },
];

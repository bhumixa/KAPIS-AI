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
  { label: 'Conversations', icon: 'forum', route: ROUTE_PATHS.CONVERSATIONS },
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
  {
    label: 'Knowledge Base',
    icon: 'menu_book',
    children: [
      {
        label: 'Services',
        icon: 'medical_information',
        route: ROUTE_PATHS.KNOWLEDGE_BASE,
        exactMatch: true,
      },
      {
        label: 'FAQs',
        icon: 'quiz',
        route: `${ROUTE_PATHS.KNOWLEDGE_BASE}/faqs`,
      },
      {
        label: 'Doctor Profiles',
        icon: 'badge',
        route: `${ROUTE_PATHS.KNOWLEDGE_BASE}/doctor-profiles`,
      },
      {
        label: 'Policies',
        icon: 'gavel',
        route: `${ROUTE_PATHS.KNOWLEDGE_BASE}/policies`,
      },
      {
        label: 'Insurance Providers',
        icon: 'health_and_safety',
        route: `${ROUTE_PATHS.KNOWLEDGE_BASE}/insurance-providers`,
      },
      {
        label: 'Message Templates',
        icon: 'forum',
        route: `${ROUTE_PATHS.KNOWLEDGE_BASE}/message-templates`,
      },
      {
        label: 'AI Prompt Settings',
        icon: 'smart_toy',
        route: `${ROUTE_PATHS.KNOWLEDGE_BASE}/ai-prompt-settings`,
      },
    ],
  },
  {
    label: 'Integrations',
    icon: 'extension',
    children: [
      {
        label: 'Overview',
        icon: 'grid_view',
        route: ROUTE_PATHS.INTEGRATIONS,
        exactMatch: true,
      },
      {
        label: 'WhatsApp',
        icon: 'chat',
        route: `${ROUTE_PATHS.INTEGRATIONS}/whatsapp`,
      },
      {
        label: 'Claude AI',
        icon: 'smart_toy',
        route: `${ROUTE_PATHS.INTEGRATIONS}/claude`,
      },
      {
        label: 'Google Calendar',
        icon: 'calendar_month',
        route: `${ROUTE_PATHS.INTEGRATIONS}/google-calendar`,
      },
      {
        label: 'Webhooks',
        icon: 'link',
        route: `${ROUTE_PATHS.INTEGRATIONS}/webhooks`,
      },
    ],
  },
  { label: 'Automation', icon: 'bolt', route: ROUTE_PATHS.AUTOMATION },
];

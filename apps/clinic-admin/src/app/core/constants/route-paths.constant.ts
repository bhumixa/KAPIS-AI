/**
 * Single source of truth for route segments. Guards, the sidenav config, and
 * `app.routes.ts` all read from here so a path never needs to be renamed in
 * more than one place.
 */
export const ROUTE_SEGMENTS = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  DOCTORS: 'doctors',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  SETTINGS: 'settings',
  KNOWLEDGE_BASE: 'knowledge-base',
  NOT_FOUND: '404',
} as const;

export const ROUTE_PATHS = {
  LOGIN: `/${ROUTE_SEGMENTS.LOGIN}`,
  DASHBOARD: `/${ROUTE_SEGMENTS.DASHBOARD}`,
  DOCTORS: `/${ROUTE_SEGMENTS.DOCTORS}`,
  PATIENTS: `/${ROUTE_SEGMENTS.PATIENTS}`,
  APPOINTMENTS: `/${ROUTE_SEGMENTS.APPOINTMENTS}`,
  SETTINGS: `/${ROUTE_SEGMENTS.SETTINGS}`,
  KNOWLEDGE_BASE: `/${ROUTE_SEGMENTS.KNOWLEDGE_BASE}`,
  NOT_FOUND: `/${ROUTE_SEGMENTS.NOT_FOUND}`,
} as const;

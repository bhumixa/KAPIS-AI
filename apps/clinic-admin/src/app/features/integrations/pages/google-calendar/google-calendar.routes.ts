import { Routes } from '@angular/router';

/** Sprint 22's four Google Calendar pages, nested under /integrations/google-calendar (see integrations.routes.ts). */
export const GOOGLE_CALENDAR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./connection/connection').then((m) => m.Connection),
    data: { breadcrumb: 'Google Calendar' },
  },
  {
    path: 'sync-status',
    loadComponent: () => import('./sync-status/sync-status').then((m) => m.SyncStatus),
    data: { breadcrumb: 'Sync Status' },
  },
  {
    path: 'sync-history',
    loadComponent: () => import('./sync-history/sync-history').then((m) => m.SyncHistory),
    data: { breadcrumb: 'Sync History' },
  },
  {
    path: 'manual-sync',
    loadComponent: () => import('./manual-sync/manual-sync').then((m) => m.ManualSync),
    data: { breadcrumb: 'Manual Sync' },
  },
];

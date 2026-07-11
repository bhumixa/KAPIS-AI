import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/analytics-dashboard/analytics-dashboard').then((m) => m.AnalyticsDashboard),
    data: { breadcrumb: 'Analytics Dashboard' },
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
    data: { breadcrumb: 'Reports' },
  },
  {
    path: 'exports',
    loadComponent: () => import('./pages/exports/exports').then((m) => m.Exports),
    data: { breadcrumb: 'Exports' },
  },
  {
    path: 'system-statistics',
    loadComponent: () =>
      import('./pages/system-statistics/system-statistics').then((m) => m.SystemStatistics),
    data: { breadcrumb: 'System Statistics' },
  },
];

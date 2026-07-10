import { Routes } from '@angular/router';

export const AUTOMATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/automation-dashboard/automation-dashboard').then(
        (m) => m.AutomationDashboard,
      ),
    data: { breadcrumb: 'Automation' },
  },
];

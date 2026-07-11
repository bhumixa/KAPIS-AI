import { Routes } from '@angular/router';

export const INTEGRATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/integrations-dashboard/integrations-dashboard').then(
        (m) => m.IntegrationsDashboard,
      ),
    data: { breadcrumb: 'Integrations' },
  },
  {
    path: 'whatsapp',
    loadComponent: () => import('./pages/whatsapp/whatsapp').then((m) => m.WhatsApp),
    data: { breadcrumb: 'WhatsApp' },
  },
  {
    path: 'claude',
    loadComponent: () => import('./pages/claude/claude').then((m) => m.Claude),
    data: { breadcrumb: 'Gemini AI' },
  },
  {
    path: 'google-calendar',
    loadChildren: () =>
      import('./pages/google-calendar/google-calendar.routes').then((m) => m.GOOGLE_CALENDAR_ROUTES),
    data: { breadcrumb: 'Google Calendar' },
  },
  {
    path: 'webhooks',
    loadComponent: () => import('./pages/webhooks/webhooks').then((m) => m.Webhooks),
    data: { breadcrumb: 'Webhooks' },
  },
];

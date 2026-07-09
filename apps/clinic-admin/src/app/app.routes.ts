import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ROUTE_SEGMENTS } from './core/constants/route-paths.constant';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: ROUTE_SEGMENTS.DASHBOARD },

  {
    path: ROUTE_SEGMENTS.LOGIN,
    canActivate: [guestGuard],
    loadComponent: () => import('./layout/login-layout/login-layout').then((m) => m.LoginLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout').then((m) => m.DashboardLayout),
    children: [
      {
        path: ROUTE_SEGMENTS.DASHBOARD,
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        data: { breadcrumb: 'Dashboard' },
      },
      {
        path: ROUTE_SEGMENTS.DOCTORS,
        loadChildren: () =>
          import('./features/doctors/doctors.routes').then((m) => m.DOCTORS_ROUTES),
      },
      {
        path: ROUTE_SEGMENTS.PATIENTS,
        loadChildren: () =>
          import('./features/patients/patients.routes').then((m) => m.PATIENTS_ROUTES),
      },
      {
        path: ROUTE_SEGMENTS.APPOINTMENTS,
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
      },
      {
        path: ROUTE_SEGMENTS.SETTINGS,
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: ROUTE_SEGMENTS.KNOWLEDGE_BASE,
        loadChildren: () =>
          import('./features/knowledge-base/knowledge-base.routes').then(
            (m) => m.KNOWLEDGE_BASE_ROUTES,
          ),
      },
    ],
  },

  {
    path: ROUTE_SEGMENTS.NOT_FOUND,
    loadComponent: () => import('./shared/components/not-found/not-found').then((m) => m.NotFound),
  },
  { path: '**', redirectTo: ROUTE_SEGMENTS.NOT_FOUND },
];

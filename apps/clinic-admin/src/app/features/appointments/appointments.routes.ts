import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/appointment-list/appointment-list').then((m) => m.AppointmentList),
    data: { breadcrumb: 'Appointments' },
  },
  {
    // Literal segments must come before ':id' - see doctors.routes.ts's 'schedule' entry.
    path: 'book',
    loadComponent: () =>
      import('./pages/appointment-book/appointment-book').then((m) => m.AppointmentBook),
    data: { breadcrumb: 'Book Appointment' },
  },
  {
    path: 'calendar',
    loadComponent: () => import('./pages/calendar-view/calendar-view').then((m) => m.CalendarView),
    data: { breadcrumb: 'Calendar View' },
  },
  {
    path: 'daily-schedule',
    loadComponent: () =>
      import('./pages/daily-schedule/daily-schedule').then((m) => m.DailySchedule),
    data: { breadcrumb: 'Daily Schedule' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/appointment-details/appointment-details').then((m) => m.AppointmentDetails),
    data: { breadcrumb: 'Appointment Details' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/appointment-edit/appointment-edit').then((m) => m.AppointmentEdit),
    data: { breadcrumb: 'Edit Appointment' },
  },
];

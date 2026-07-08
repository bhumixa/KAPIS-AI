import { Routes } from '@angular/router';

export const SCHEDULE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/schedule-list/schedule-list').then((m) => m.ScheduleList),
    data: { breadcrumb: 'Doctor Schedule' },
  },
  {
    path: 'leave',
    loadComponent: () => import('./pages/doctor-leave/doctor-leave').then((m) => m.DoctorLeavePage),
    data: { breadcrumb: 'Doctor Leave' },
  },
  {
    path: 'holidays',
    loadComponent: () =>
      import('./pages/clinic-holidays/clinic-holidays').then((m) => m.ClinicHolidays),
    data: { breadcrumb: 'Clinic Holidays' },
  },
  {
    path: 'manage/:doctorId',
    loadComponent: () =>
      import('./pages/manage-schedule/manage-schedule').then((m) => m.ManageSchedule),
    data: { breadcrumb: 'Manage Schedule' },
  },
];

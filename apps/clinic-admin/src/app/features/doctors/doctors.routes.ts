import { Routes } from '@angular/router';

export const DOCTORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/doctor-list/doctor-list').then((m) => m.DoctorList),
    data: { breadcrumb: 'Doctors' },
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/doctor-add/doctor-add').then((m) => m.DoctorAdd),
    data: { breadcrumb: 'Add Doctor' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/doctor-details/doctor-details').then((m) => m.DoctorDetails),
    data: { breadcrumb: 'Doctor Details' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/doctor-edit/doctor-edit').then((m) => m.DoctorEdit),
    data: { breadcrumb: 'Edit Doctor' },
  },
];

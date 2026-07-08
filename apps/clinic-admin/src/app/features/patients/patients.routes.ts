import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/patient-list/patient-list').then((m) => m.PatientList),
    data: { breadcrumb: 'Patients' },
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/patient-add/patient-add').then((m) => m.PatientAdd),
    data: { breadcrumb: 'Add Patient' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/patient-details/patient-details').then((m) => m.PatientDetails),
    data: { breadcrumb: 'Patient Details' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/patient-edit/patient-edit').then((m) => m.PatientEdit),
    data: { breadcrumb: 'Edit Patient' },
  },
];

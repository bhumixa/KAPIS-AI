import { Routes } from '@angular/router';

export const KNOWLEDGE_BASE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/services/services').then((m) => m.Services),
    data: { breadcrumb: 'Services' },
  },
  {
    path: 'faqs',
    loadComponent: () => import('./pages/faqs/faqs').then((m) => m.Faqs),
    data: { breadcrumb: 'FAQs' },
  },
  {
    path: 'doctor-profiles',
    loadComponent: () =>
      import('./pages/doctor-profiles/doctor-profiles').then((m) => m.DoctorProfiles),
    data: { breadcrumb: 'Doctor Profiles' },
  },
  {
    path: 'policies',
    loadComponent: () => import('./pages/policies/policies').then((m) => m.Policies),
    data: { breadcrumb: 'Policies' },
  },
  {
    path: 'insurance-providers',
    loadComponent: () =>
      import('./pages/insurance-providers/insurance-providers').then((m) => m.InsuranceProviders),
    data: { breadcrumb: 'Insurance Providers' },
  },
  {
    path: 'message-templates',
    loadComponent: () =>
      import('./pages/message-templates/message-templates').then((m) => m.MessageTemplates),
    data: { breadcrumb: 'Message Templates' },
  },
  {
    path: 'ai-prompt-settings',
    loadComponent: () =>
      import('./pages/ai-prompt-settings/ai-prompt-settings').then((m) => m.AiPromptSettingsPage),
    data: { breadcrumb: 'AI Prompt Settings' },
  },
];

import { Routes } from '@angular/router';

export const CONVERSATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inbox/inbox').then((m) => m.Inbox),
    data: { breadcrumb: 'Conversations' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/conversation-details/conversation-details').then(
        (m) => m.ConversationDetails,
      ),
    data: { breadcrumb: 'Conversation Details' },
  },
];

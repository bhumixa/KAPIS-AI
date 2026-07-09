import { Conversation } from './conversation.model';

/**
 * Inbox-row view model - joins `Conversation` with the patient/message data
 * it needs to render without the presentational list component reaching into
 * `PatientService`/`MessageService` itself (those joins stay in the `Inbox`
 * page, same split `AppointmentList`/`AppointmentTable` use).
 */
export interface ConversationListItem {
  conversation: Conversation;
  patientName: string;
  patientInitials: string;
  assignedToName: string | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

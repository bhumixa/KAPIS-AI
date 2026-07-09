import { IntegrationStatus } from './integration-status.model';

/** Google Calendar OAuth configuration - placeholder only, no Google API calls are made. */
export interface GoogleCalendarIntegration {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  calendarId: string;
  enabled: boolean;
  status: IntegrationStatus;
  updatedAt: string;
}

export type GoogleCalendarIntegrationInput = Omit<
  GoogleCalendarIntegration,
  'status' | 'updatedAt'
>;

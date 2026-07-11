import { IntegrationStatus } from './integration-status.model';

/** Mirrors apps/api-server's CalendarConnectionDto. Never carries a raw access/refresh token - those never leave the backend. */
export interface CalendarConnection {
  connected: boolean;
  status: IntegrationStatus;
  calendarId: string;
  connectedEmail: string;
  tokenExpiry: string | null;
  lastSyncAt: string | null;
}

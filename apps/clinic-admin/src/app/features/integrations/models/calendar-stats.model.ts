import { IntegrationStatus } from './integration-status.model';

/** Mirrors apps/api-server's CalendarStatsDto (GET /api/google-calendar/stats) - the Automation Dashboard's three Sprint 22 tiles. */
export interface CalendarStats {
  connected: boolean;
  status: IntegrationStatus;
  calendarId: string | null;
  lastSync: string | null;
  eventsSyncedToday: number;
}

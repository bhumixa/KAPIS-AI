/** Mirrors apps/api-server's CalendarHealthDto (GET /api/google-calendar/health). */
export interface CalendarHealth {
  connected: boolean;
  calendarId: string | null;
  lastSync: string | null;
  provider: string;
}

/** Mirrors apps/api-server's CalendarSyncLogDto - one row of the Sync History page/table. */
export type CalendarSyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'NOTIFY';
export type CalendarSyncOutcome = 'SUCCESS' | 'FAILED';

export interface CalendarSyncLog {
  id: string;
  appointmentId: string | null;
  googleEventId: string | null;
  operation: CalendarSyncOperation;
  status: CalendarSyncOutcome;
  errorMessage: string | null;
  syncedAt: string;
}

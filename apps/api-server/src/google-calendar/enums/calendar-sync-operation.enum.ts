/** Which Google Calendar API call (or, for NOTIFY, incoming push notification) a clinic.google_calendar_sync_events row records. */
export enum CalendarSyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  NOTIFY = 'NOTIFY',
}

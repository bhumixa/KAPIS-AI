/** Mirrors apps/api-server's CalendarEventDto - the Google Calendar event currently synced for an appointment. */
export interface CalendarEvent {
  googleEventId: string;
  appointmentId: string;
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  htmlLink: string | null;
}

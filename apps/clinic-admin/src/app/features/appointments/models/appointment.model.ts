export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export type AppointmentType = 'consultation' | 'follow-up' | 'checkup' | 'procedure' | 'emergency';

export const APPOINTMENT_TYPES: readonly AppointmentType[] = [
  'consultation',
  'follow-up',
  'checkup',
  'procedure',
  'emergency',
];

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  'follow-up': 'Follow-up',
  checkup: 'Checkup',
  procedure: 'Procedure',
  emergency: 'Emergency',
};

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  /** ISO date ("yyyy-MM-dd") the appointment is booked for. */
  date: string;
  /** "HH:mm" 24-hour string. */
  startTime: string;
  /** "HH:mm" 24-hour string. */
  endTime: string;
  /**
   * Snapshotted from the doctor's `consultationDuration` at booking time -
   * stored (not recomputed from start/end) so a later change to the
   * doctor's consultation duration doesn't rewrite history.
   */
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Create/update payload - the server (today: the mock service) owns id and timestamps. */
export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;

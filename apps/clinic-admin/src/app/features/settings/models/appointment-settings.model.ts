export interface AppointmentSettings {
  /** Minutes - falls back for doctors that don't set their own `consultationDuration`. */
  defaultConsultationDuration: number;
  /** Minutes of gap enforced between two appointments for the same doctor. */
  bufferBetweenAppointments: number;
  /** How many days ahead a patient/receptionist can book. */
  advanceBookingLimitDays: number;
  allowOnlineBooking: boolean;
  /** Hours before the appointment start after which cancelling is blocked. */
  cancellationWindowHours: number;
  /** Hours before the appointment start after which rescheduling is blocked. */
  rescheduleWindowHours: number;
  autoConfirmAppointment: boolean;
  allowWalkIns: boolean;
  updatedAt: string;
}

export type AppointmentSettingsInput = Omit<AppointmentSettings, 'updatedAt'>;

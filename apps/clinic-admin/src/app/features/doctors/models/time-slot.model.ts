import { ClinicHoliday } from './clinic-holiday.model';
import { DoctorLeave } from './doctor-leave.model';
import { DoctorSchedule } from './doctor-schedule.model';

export interface TimeSlot {
  /** "HH:mm" 24-hour string. */
  start: string;
  /** "HH:mm" 24-hour string. */
  end: string;
}

/** An already-booked slot on the target date - stands in for a future AppointmentService. */
export type BookedSlot = TimeSlot;

export interface SlotGeneratorInput {
  doctorId: string;
  /** ISO date ("yyyy-MM-dd") the slots are being generated for. */
  date: string;
  schedule: DoctorSchedule;
  consultationDuration: number;
  existingAppointments: BookedSlot[];
  leaves: DoctorLeave[];
  holidays: ClinicHoliday[];
}

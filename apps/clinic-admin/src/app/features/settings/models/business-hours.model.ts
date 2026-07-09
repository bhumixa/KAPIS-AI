import { DayOfWeek } from '../../doctors/models/doctor-schedule.model';

/**
 * Reuses `DayOfWeek` from the doctors' schedule model rather than redefining
 * the same 7-value union here - it's a generic calendar concept, not a
 * doctor-specific one, and Sprint 5 already established cross-feature reuse
 * of this exact type (and its pure date/time utils) as the intended pattern.
 */
export interface BusinessDayHours {
  day: DayOfWeek;
  isOpen: boolean;
  /** "HH:mm" 24-hour strings - matches native `<input type="time">` value format. */
  openTime: string;
  closeTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
}

export interface BusinessHours {
  days: BusinessDayHours[];
  updatedAt: string;
}

export type BusinessHoursInput = Pick<BusinessHours, 'days'>;

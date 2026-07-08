export type DayOfWeek =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Monday-first, matching how the weekly editor and schedule tables render days. */
export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export interface DaySchedule {
  day: DayOfWeek;
  isWorking: boolean;
  /** "HH:mm" 24-hour strings - matches native `<input type="time">` value format. */
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

export interface DoctorSchedule {
  doctorId: string;
  days: DaySchedule[];
  updatedAt: string;
}

export type DoctorScheduleInput = Pick<DoctorSchedule, 'days'>;

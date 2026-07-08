export interface ClinicHoliday {
  id: string;
  name: string;
  /** ISO date ("yyyy-MM-dd") of the (first) occurrence. */
  date: string;
  /** When true, the holiday recurs every year on this date's month/day. */
  recurringYearly: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ClinicHolidayInput = Omit<ClinicHoliday, 'id' | 'createdAt' | 'updatedAt'>;

import { toIsoDate } from '../../doctors/schedule/utils/schedule-date.util';

/**
 * Pure, dependency-free date-grid helpers for the Calendar View - reuses
 * `toIsoDate` from the schedule utils instead of re-implementing ISO
 * formatting here. Monday-first throughout, matching `DAYS_OF_WEEK`.
 */

/** 42 ISO dates (6 Monday-first weeks) covering the given month, including lead/trail days. */
export function getMonthGridDates(year: number, month: number): string[] {
  const firstOfMonth = new Date(year, month, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) =>
    toIsoDate(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)),
  );
}

/** The 7 ISO dates (Mon-Sun) of the week containing `isoDate`. */
export function getWeekDates(isoDate: string): string[] {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(year, month - 1, day - mondayOffset);

  return Array.from({ length: 7 }, (_, index) =>
    toIsoDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)),
  );
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const total = month + delta;
  return { year: year + Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return toIsoDate(new Date(year, month - 1, day + days));
}

export const MONTH_NAMES: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

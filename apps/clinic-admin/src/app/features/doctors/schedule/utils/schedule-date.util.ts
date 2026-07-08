import { DayOfWeek } from '../../models/doctor-schedule.model';

/** `Date.getDay()` is Sunday-first (0-6); our schedule model is Monday-first. */
const JS_DAY_INDEX_TO_DAY_OF_WEEK: readonly DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayOfWeek(isoDate: string): DayOfWeek {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return JS_DAY_INDEX_TO_DAY_OF_WEEK[date.getDay()];
}

export function isDateInRange(isoDate: string, startIsoDate: string, endIsoDate: string): boolean {
  return isoDate >= startIsoDate && isoDate <= endIsoDate;
}

/** Matches on month/day only, so a `recurringYearly` holiday hits every year. */
export function isSameMonthAndDay(isoDateA: string, isoDateB: string): boolean {
  return isoDateA.slice(5) === isoDateB.slice(5);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

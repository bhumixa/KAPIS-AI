import { DayOfWeek } from './dto/day-schedule.dto';

// Mirrors apps/clinic-admin's features/doctors/schedule/utils/schedule-date.util.ts
// exactly, so "which day of week is this date" and "is this holiday recurring
// yearly" resolve identically on both sides.

const JS_DAY_INDEX_TO_DAY_OF_WEEK: readonly DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function getDayOfWeek(isoDate: string): DayOfWeek {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return JS_DAY_INDEX_TO_DAY_OF_WEEK[date.getDay()];
}

export function isDateInRange(isoDate: string, startIsoDate: string, endIsoDate: string): boolean {
  return isoDate >= startIsoDate && isoDate <= endIsoDate;
}

export function isSameMonthAndDay(isoDateA: string, isoDateB: string): boolean {
  return isoDateA.slice(5) === isoDateB.slice(5);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

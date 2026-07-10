// Prisma maps Postgres `date`/`time` columns to JS `Date` objects anchored at
// UTC midnight / 1970-01-01 respectively. The Angular models (and this API's
// DTOs) use plain "yyyy-MM-dd"/"HH:mm" strings instead (see
// docs/DevelopmentGuide.md's Sprint 3 notes on the schedule utils) - these
// helpers are the one place that conversion happens, so every
// repository/service stays string-in, string-out.

export function isoDateToDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function dateToIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function timeStringToDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

export function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

import { timeToMinutes } from '../schedule/schedule-date.util';

// Mirrors apps/clinic-admin's doTimeRangesOverlap() exactly - kept dependency-free
// so it stays trivially testable independent of Prisma/Nest.
export function doTimeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const startAMinutes = timeToMinutes(startA);
  const endAMinutes = timeToMinutes(endA);
  const startBMinutes = timeToMinutes(startB);
  const endBMinutes = timeToMinutes(endB);

  return startAMinutes < endBMinutes && endAMinutes > startBMinutes;
}

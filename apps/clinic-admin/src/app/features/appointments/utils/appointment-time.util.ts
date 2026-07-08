import { timeToMinutes } from '../../doctors/schedule/utils/schedule-date.util';

/**
 * Pure, dependency-free so `AppointmentService` can enforce "no overlapping
 * appointments" defensively even if the booking UI's slot list was stale.
 * Reuses `timeToMinutes` from the schedule utils rather than re-parsing
 * "HH:mm" strings here.
 */
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

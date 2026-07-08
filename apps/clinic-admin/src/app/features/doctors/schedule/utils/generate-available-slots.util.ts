import { SlotGeneratorInput, TimeSlot } from '../../models/time-slot.model';
import {
  getDayOfWeek,
  isDateInRange,
  isSameMonthAndDay,
  minutesToTime,
  timeToMinutes,
} from './schedule-date.util';

function isHoliday(date: string, holidays: SlotGeneratorInput['holidays']): boolean {
  return holidays.some((holiday) =>
    holiday.recurringYearly ? isSameMonthAndDay(holiday.date, date) : holiday.date === date,
  );
}

function isOnLeave(doctorId: string, date: string, leaves: SlotGeneratorInput['leaves']): boolean {
  return leaves.some(
    (leave) => leave.doctorId === doctorId && isDateInRange(date, leave.startDate, leave.endDate),
  );
}

function slotsInWindow(
  windowStart: string,
  windowEnd: string,
  durationMinutes: number,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const endMinutes = timeToMinutes(windowEnd);

  for (
    let start = timeToMinutes(windowStart);
    start + durationMinutes <= endMinutes;
    start += durationMinutes
  ) {
    slots.push({ start: minutesToTime(start), end: minutesToTime(start + durationMinutes) });
  }

  return slots;
}

function overlapsAny(slot: TimeSlot, booked: readonly TimeSlot[]): boolean {
  const slotStart = timeToMinutes(slot.start);
  const slotEnd = timeToMinutes(slot.end);

  return booked.some((existing) => {
    const bookedStart = timeToMinutes(existing.start);
    const bookedEnd = timeToMinutes(existing.end);
    return slotStart < bookedEnd && slotEnd > bookedStart;
  });
}

/**
 * Pure slot-generation algorithm shared by AvailabilityService and, later, the
 * appointment-booking feature. Kept dependency-free (no DI, no services) so it
 * stays trivially reusable and testable wherever slots need to be computed.
 */
export function generateAvailableSlots(input: SlotGeneratorInput): TimeSlot[] {
  const { doctorId, date, schedule, consultationDuration, existingAppointments, leaves, holidays } =
    input;

  if (isHoliday(date, holidays) || isOnLeave(doctorId, date, leaves)) {
    return [];
  }

  const daySchedule = schedule.days.find((day) => day.day === getDayOfWeek(date));
  if (!daySchedule || !daySchedule.isWorking) {
    return [];
  }

  const candidateSlots = [
    ...slotsInWindow(daySchedule.morningStart, daySchedule.morningEnd, consultationDuration),
    ...slotsInWindow(daySchedule.afternoonStart, daySchedule.afternoonEnd, consultationDuration),
  ];

  return candidateSlots.filter((slot) => !overlapsAny(slot, existingAppointments));
}

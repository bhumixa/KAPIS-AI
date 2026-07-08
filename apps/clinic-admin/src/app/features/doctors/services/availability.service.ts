import { Injectable, computed, inject } from '@angular/core';
import { ClinicHoliday } from '../models/clinic-holiday.model';
import { DoctorLeave } from '../models/doctor-leave.model';
import { SlotGeneratorInput, TimeSlot } from '../models/time-slot.model';
import { DoctorService } from './doctor.service';
import { ScheduleService } from './schedule.service';
import { generateAvailableSlots } from '../schedule/utils/generate-available-slots.util';
import {
  getDayOfWeek,
  isDateInRange,
  isSameMonthAndDay,
  toIsoDate,
} from '../schedule/utils/schedule-date.util';

/**
 * Derives availability from `DoctorService` + `ScheduleService` state -
 * doesn't own or mutate any data itself, so it stays a pure read/compute
 * layer. `generateAvailableSlots()` is delegated to a dependency-free util so
 * the same algorithm is reusable outside Angular DI (e.g. by a future
 * appointment-booking flow) without going through this service.
 */
@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly doctorService = inject(DoctorService);
  private readonly scheduleService = inject(ScheduleService);

  private isHolidayOn(
    isoDate: string,
    holidays: readonly ClinicHoliday[] = this.scheduleService.holidays(),
  ): boolean {
    return holidays.some((holiday) =>
      holiday.recurringYearly ? isSameMonthAndDay(holiday.date, isoDate) : holiday.date === isoDate,
    );
  }

  isDoctorOnLeave(
    doctorId: string,
    isoDate: string,
    leaves: readonly DoctorLeave[] = this.scheduleService.leaves(),
  ): boolean {
    return leaves.some(
      (leave) =>
        leave.doctorId === doctorId && isDateInRange(isoDate, leave.startDate, leave.endDate),
    );
  }

  isDoctorAvailableOn(doctorId: string, isoDate: string): boolean {
    const doctor = this.doctorService.doctors().find((d) => d.id === doctorId);
    if (!doctor || doctor.status !== 'active') {
      return false;
    }

    if (this.isHolidayOn(isoDate) || this.isDoctorOnLeave(doctorId, isoDate)) {
      return false;
    }

    const schedule = this.scheduleService.schedules().find((s) => s.doctorId === doctorId);
    const daySchedule = schedule?.days.find((day) => day.day === getDayOfWeek(isoDate));
    return daySchedule?.isWorking ?? false;
  }

  readonly doctorsAvailableToday = computed(() => {
    const today = toIsoDate(new Date());
    return this.doctorService
      .doctors()
      .filter((doctor) => this.isDoctorAvailableOn(doctor.id, today)).length;
  });

  readonly doctorsOnLeaveToday = computed(() => {
    const today = toIsoDate(new Date());
    return this.doctorService.doctors().filter((doctor) => this.isDoctorOnLeave(doctor.id, today))
      .length;
  });

  generateSlots(input: SlotGeneratorInput): TimeSlot[] {
    return generateAvailableSlots(input);
  }
}

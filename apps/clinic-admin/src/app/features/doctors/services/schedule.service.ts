import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { ClinicHoliday, ClinicHolidayInput } from '../models/clinic-holiday.model';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  DaySchedule,
  DoctorSchedule,
  DoctorScheduleInput,
} from '../models/doctor-schedule.model';
import { DoctorLeave, DoctorLeaveInput } from '../models/doctor-leave.model';
import { toIsoDate } from '../schedule/utils/schedule-date.util';

const STANDARD_HOURS: Pick<
  DaySchedule,
  'morningStart' | 'morningEnd' | 'afternoonStart' | 'afternoonEnd'
> = {
  morningStart: '09:00',
  morningEnd: '13:00',
  afternoonStart: '14:00',
  afternoonEnd: '18:00',
};

function createDefaultDays(offDays: readonly DayOfWeek[] = ['saturday', 'sunday']): DaySchedule[] {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    isWorking: !offDays.includes(day),
    ...STANDARD_HOURS,
  }));
}

function createMockSchedules(): DoctorSchedule[] {
  const now = new Date().toISOString();

  return [
    { doctorId: 'doc-1', days: createDefaultDays(), updatedAt: now },
    { doctorId: 'doc-2', days: createDefaultDays(), updatedAt: now },
    { doctorId: 'doc-3', days: createDefaultDays(['sunday']), updatedAt: now },
    { doctorId: 'doc-4', days: createDefaultDays(DAYS_OF_WEEK), updatedAt: now },
    { doctorId: 'doc-5', days: createDefaultDays(), updatedAt: now },
    { doctorId: 'doc-6', days: createDefaultDays(), updatedAt: now },
  ];
}

function createMockLeaves(): DoctorLeave[] {
  const today = new Date();
  const now = today.toISOString();
  const addDays = (offset: number) =>
    toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));

  return [
    {
      id: 'leave-1',
      doctorId: 'doc-2',
      type: 'sick',
      startDate: addDays(0),
      endDate: addDays(1),
      reason: 'Flu recovery',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'leave-2',
      doctorId: 'doc-5',
      type: 'vacation',
      startDate: addDays(7),
      endDate: addDays(12),
      reason: 'Annual family vacation',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'leave-3',
      doctorId: 'doc-6',
      type: 'conference',
      startDate: addDays(-3),
      endDate: addDays(-1),
      reason: 'Medical conference',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createMockHolidays(): ClinicHoliday[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'holiday-1',
      name: "New Year's Day",
      date: '2026-01-01',
      recurringYearly: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'holiday-2',
      name: 'Independence Day',
      date: '2026-08-15',
      recurringYearly: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'holiday-3',
      name: 'Clinic Foundation Day',
      date: '2026-11-20',
      recurringYearly: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Sprint 3 has no backend, so schedules/leaves/holidays all live in signals
 * seeded from mock data - same signal-plus-Observable split `DoctorService`
 * established in Sprint 2. `AvailabilityService` reads these signals to derive
 * "available today"/"on leave" without duplicating any CRUD or storage logic
 * here.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly _schedules = signal<DoctorSchedule[]>(createMockSchedules());
  private readonly _leaves = signal<DoctorLeave[]>(createMockLeaves());
  private readonly _holidays = signal<ClinicHoliday[]>(createMockHolidays());

  readonly schedules = this._schedules.asReadonly();
  readonly leaves = this._leaves.asReadonly();
  readonly holidays = this._holidays.asReadonly();

  // ---- Schedules --------------------------------------------------------

  getSchedules(): Observable<DoctorSchedule[]> {
    return of(this._schedules()).pipe(delay(300));
  }

  getSchedule(doctorId: string): Observable<DoctorSchedule> {
    const existing = this._schedules().find((schedule) => schedule.doctorId === doctorId);
    const schedule: DoctorSchedule = existing ?? {
      doctorId,
      days: createDefaultDays(),
      updatedAt: new Date().toISOString(),
    };

    return of(schedule).pipe(delay(300));
  }

  updateSchedule(doctorId: string, input: DoctorScheduleInput): Observable<DoctorSchedule> {
    const updated: DoctorSchedule = {
      doctorId,
      days: input.days,
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(300),
      tap((schedule) =>
        this._schedules.update((schedules) => {
          const exists = schedules.some((s) => s.doctorId === doctorId);
          return exists
            ? schedules.map((s) => (s.doctorId === doctorId ? schedule : s))
            : [...schedules, schedule];
        }),
      ),
    );
  }

  // ---- Leaves -------------------------------------------------------------

  getLeaves(): Observable<DoctorLeave[]> {
    return of(this._leaves()).pipe(delay(300));
  }

  createLeave(input: DoctorLeaveInput): Observable<DoctorLeave> {
    const now = new Date().toISOString();
    const leave: DoctorLeave = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(leave).pipe(
      delay(300),
      tap((created) => this._leaves.update((leaves) => [...leaves, created])),
    );
  }

  updateLeave(id: string, input: DoctorLeaveInput): Observable<DoctorLeave> {
    const existing = this._leaves().find((leave) => leave.id === id);

    if (!existing) {
      return throwError(() => new Error(`Leave "${id}" was not found.`));
    }

    const updated: DoctorLeave = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((leave) => this._leaves.update((leaves) => leaves.map((l) => (l.id === id ? leave : l)))),
    );
  }

  deleteLeave(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._leaves.update((leaves) => leaves.filter((leave) => leave.id !== id))),
    );
  }

  // ---- Holidays -----------------------------------------------------------

  getHolidays(): Observable<ClinicHoliday[]> {
    return of(this._holidays()).pipe(delay(300));
  }

  createHoliday(input: ClinicHolidayInput): Observable<ClinicHoliday> {
    const now = new Date().toISOString();
    const holiday: ClinicHoliday = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(holiday).pipe(
      delay(300),
      tap((created) => this._holidays.update((holidays) => [...holidays, created])),
    );
  }

  updateHoliday(id: string, input: ClinicHolidayInput): Observable<ClinicHoliday> {
    const existing = this._holidays().find((holiday) => holiday.id === id);

    if (!existing) {
      return throwError(() => new Error(`Holiday "${id}" was not found.`));
    }

    const updated: ClinicHoliday = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((holiday) =>
        this._holidays.update((holidays) => holidays.map((h) => (h.id === id ? holiday : h))),
      ),
    );
  }

  deleteHoliday(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() =>
        this._holidays.update((holidays) => holidays.filter((holiday) => holiday.id !== id)),
      ),
    );
  }
}

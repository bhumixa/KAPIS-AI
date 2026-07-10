import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, forkJoin, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClinicHoliday, ClinicHolidayInput } from '../models/clinic-holiday.model';
import { DoctorSchedule, DoctorScheduleInput } from '../models/doctor-schedule.model';
import { DoctorLeave, DoctorLeaveInput } from '../models/doctor-leave.model';
import { DoctorService } from './doctor.service';

/**
 * Sprint 13 replaces the Sprint 3 mock data with the real Schedule API
 * (apps/api-server's ScheduleModule): `GET/PUT /doctors/:doctorId/schedule`,
 * full CRUD at `/doctor-leaves` and `/clinic-holidays`. There is no "list every
 * doctor's schedule" endpoint (the backend only exposes it per-doctor, the same
 * way the Angular UI only ever needs one doctor's schedule at a time) - the
 * `schedules` signal that `AvailabilityService` reads is instead kept in sync by
 * fetching each doctor in `DoctorService.doctors()` individually and merging
 * the results, re-running whenever that list changes.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly doctorService = inject(DoctorService);

  private readonly doctorsUrl = `${environment.apiBaseUrl}/doctors`;
  private readonly leavesUrl = `${environment.apiBaseUrl}/doctor-leaves`;
  private readonly holidaysUrl = `${environment.apiBaseUrl}/clinic-holidays`;

  private readonly _schedules = signal<DoctorSchedule[]>([]);
  private readonly _leaves = signal<DoctorLeave[]>([]);
  private readonly _holidays = signal<ClinicHoliday[]>([]);

  readonly schedules = this._schedules.asReadonly();
  readonly leaves = this._leaves.asReadonly();
  readonly holidays = this._holidays.asReadonly();

  constructor() {
    this.getLeaves().subscribe();
    this.getHolidays().subscribe();

    effect(() => {
      const doctorIds = this.doctorService.doctors().map((doctor) => doctor.id);
      if (doctorIds.length) {
        this.refreshSchedules(doctorIds);
      }
    });
  }

  private refreshSchedules(doctorIds: string[]): void {
    forkJoin(doctorIds.map((doctorId) => this.fetchSchedule(doctorId))).subscribe((schedules) =>
      this._schedules.set(schedules),
    );
  }

  private fetchSchedule(doctorId: string): Observable<DoctorSchedule> {
    return this.http.get<DoctorSchedule>(`${this.doctorsUrl}/${doctorId}/schedule`);
  }

  // ---- Schedules --------------------------------------------------------

  getSchedules(): Observable<DoctorSchedule[]> {
    return of(this._schedules());
  }

  getSchedule(doctorId: string): Observable<DoctorSchedule> {
    return this.fetchSchedule(doctorId);
  }

  updateSchedule(doctorId: string, input: DoctorScheduleInput): Observable<DoctorSchedule> {
    return this.http.put<DoctorSchedule>(`${this.doctorsUrl}/${doctorId}/schedule`, input).pipe(
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
    return this.http
      .get<DoctorLeave[]>(this.leavesUrl)
      .pipe(tap((leaves) => this._leaves.set(leaves)));
  }

  createLeave(input: DoctorLeaveInput): Observable<DoctorLeave> {
    return this.http
      .post<DoctorLeave>(this.leavesUrl, input)
      .pipe(tap((created) => this._leaves.update((leaves) => [...leaves, created])));
  }

  updateLeave(id: string, input: DoctorLeaveInput): Observable<DoctorLeave> {
    return this.http
      .patch<DoctorLeave>(`${this.leavesUrl}/${id}`, input)
      .pipe(
        tap((updated) =>
          this._leaves.update((leaves) => leaves.map((l) => (l.id === id ? updated : l))),
        ),
      );
  }

  deleteLeave(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.leavesUrl}/${id}`)
      .pipe(tap(() => this._leaves.update((leaves) => leaves.filter((leave) => leave.id !== id))));
  }

  // ---- Holidays -----------------------------------------------------------

  getHolidays(): Observable<ClinicHoliday[]> {
    return this.http
      .get<ClinicHoliday[]>(this.holidaysUrl)
      .pipe(tap((holidays) => this._holidays.set(holidays)));
  }

  createHoliday(input: ClinicHolidayInput): Observable<ClinicHoliday> {
    return this.http
      .post<ClinicHoliday>(this.holidaysUrl, input)
      .pipe(tap((created) => this._holidays.update((holidays) => [...holidays, created])));
  }

  updateHoliday(id: string, input: ClinicHolidayInput): Observable<ClinicHoliday> {
    return this.http
      .patch<ClinicHoliday>(`${this.holidaysUrl}/${id}`, input)
      .pipe(
        tap((updated) =>
          this._holidays.update((holidays) => holidays.map((h) => (h.id === id ? updated : h))),
        ),
      );
  }

  deleteHoliday(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.holidaysUrl}/${id}`)
      .pipe(
        tap(() =>
          this._holidays.update((holidays) => holidays.filter((holiday) => holiday.id !== id)),
        ),
      );
  }
}

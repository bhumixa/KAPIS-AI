import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Appointment, AppointmentInput, AppointmentStatus } from '../models/appointment.model';
import { DoctorService } from '../../doctors/services/doctor.service';
import { PatientService } from '../../patients/services/patient.service';
import { AvailabilityService } from '../../doctors/services/availability.service';
import { BookedSlot, TimeSlot } from '../../doctors/models/time-slot.model';
import { toIsoDate } from '../../doctors/schedule/utils/schedule-date.util';

/**
 * Sprint 13 replaces the Sprint 5 mock data with the real Appointments API
 * (apps/api-server's AppointmentsModule) - same signal-plus-Observable shape
 * as every other rewired service. Unlike DoctorService/PatientService, booking
 * rules (doctor/patient exist and are active, doctor working/not on leave or
 * holiday, no overlap, duration snapshot) move server-side per Sprint 13's
 * brief - `validateBooking()` is gone; the backend now returns a 400/404/409
 * with a message when a rule is violated, and `createAppointment()`/
 * `updateAppointment()` just surface that error to the caller unchanged (both
 * pages already display `error.message` in a snackbar). Slot generation stays
 * client-side (`getAvailableSlots()` still composes `AvailabilityService`),
 * since the backend never exposed a "list available slots" endpoint - it only
 * needs to know a chosen slot is still valid at booking time, which the
 * create/update call itself confirms.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly availabilityService = inject(AvailabilityService);

  private readonly baseUrl = `${environment.apiBaseUrl}/appointments`;

  private readonly _appointments = signal<Appointment[]>([]);

  readonly appointments = this._appointments.asReadonly();

  constructor() {
    this.getAppointments().subscribe();
  }

  readonly todaysAppointmentCount = computed(() => {
    const today = toIsoDate(new Date());
    return this._appointments().filter((appointment) => appointment.date === today).length;
  });

  readonly upcomingAppointmentCount = computed(() => {
    const today = toIsoDate(new Date());
    return this._appointments().filter(
      (appointment) => appointment.date > today && appointment.status === 'scheduled',
    ).length;
  });

  readonly cancelledTodayCount = computed(() => {
    const today = toIsoDate(new Date());
    return this._appointments().filter(
      (appointment) => appointment.date === today && appointment.status === 'cancelled',
    ).length;
  });

  readonly completedTodayCount = computed(() => {
    const today = toIsoDate(new Date());
    return this._appointments().filter(
      (appointment) => appointment.date === today && appointment.status === 'completed',
    ).length;
  });

  getPatientName(patientId: string): string {
    const patient = this.patientService.patients().find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getDoctorName(doctorId: string): string {
    const doctor = this.doctorService.doctors().find((d) => d.id === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
  }

  /**
   * Slots for a doctor/date, already excluding this doctor's other
   * non-cancelled appointments - reads `_appointments()` directly (not
   * through an Observable) so a `computed()` in a booking/edit page picks up
   * new bookings immediately, satisfying "update available slots immediately
   * after booking" without any extra plumbing.
   */
  getAvailableSlots(doctorId: string, isoDate: string, excludeAppointmentId?: string): TimeSlot[] {
    const existingAppointments: BookedSlot[] = this._appointments()
      .filter(
        (appointment) =>
          appointment.doctorId === doctorId &&
          appointment.date === isoDate &&
          appointment.status !== 'cancelled' &&
          appointment.id !== excludeAppointmentId,
      )
      .map((appointment) => ({ start: appointment.startTime, end: appointment.endTime }));

    return this.availabilityService.getAvailableSlots(doctorId, isoDate, existingAppointments);
  }

  getAppointments(): Observable<Appointment[]> {
    return this.http
      .get<Appointment[]>(this.baseUrl)
      .pipe(tap((appointments) => this._appointments.set(appointments)));
  }

  getAppointment(id: string): Observable<Appointment | undefined> {
    return this.http
      .get<Appointment>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  createAppointment(input: AppointmentInput): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, input).pipe(
      tap((created) => this._appointments.update((appointments) => [...appointments, created])),
      catchError((error: HttpErrorResponse) => this.mapBookingError(error)),
    );
  }

  updateAppointment(id: string, input: AppointmentInput): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}`, input).pipe(
      tap((appointment) =>
        this._appointments.update((appointments) =>
          appointments.map((a) => (a.id === id ? appointment : a)),
        ),
      ),
      catchError((error: HttpErrorResponse) => this.mapBookingError(error)),
    );
  }

  /**
   * appointment-book.ts/appointment-edit.ts read `error.message` in their
   * snackbar handlers - a holdover from the Sprint 5 mock's
   * `validateBooking()`, which threw a plain `Error(message)` for every
   * booking-rule violation. AppointmentsService now returns that same message
   * in the response body (`AllExceptionsFilter`'s `{ message }` shape), so
   * this maps it back onto an `Error` instead of touching either page.
   */
  private mapBookingError(error: HttpErrorResponse): Observable<never> {
    const body = error.error as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    return throwError(() => new Error(message ?? error.message));
  }

  private setStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http
      .patch<Appointment>(`${this.baseUrl}/${id}`, { status })
      .pipe(
        tap((appointment) =>
          this._appointments.update((appointments) =>
            appointments.map((a) => (a.id === id ? appointment : a)),
          ),
        ),
      );
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.setStatus(id, 'cancelled');
  }

  completeAppointment(id: string): Observable<Appointment> {
    return this.setStatus(id, 'completed');
  }
}

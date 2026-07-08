import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { Appointment, AppointmentInput, AppointmentStatus } from '../models/appointment.model';
import { DoctorService } from '../../doctors/services/doctor.service';
import { PatientService } from '../../patients/services/patient.service';
import { AvailabilityService } from '../../doctors/services/availability.service';
import { BookedSlot, TimeSlot } from '../../doctors/models/time-slot.model';
import { toIsoDate } from '../../doctors/schedule/utils/schedule-date.util';
import { doTimeRangesOverlap } from '../utils/appointment-time.util';

function createMockAppointments(): Appointment[] {
  const today = new Date();
  const now = today.toISOString();
  const addDays = (offset: number) =>
    toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));

  const base: Omit<Appointment, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'apt-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: addDays(0),
      startTime: '09:00',
      endTime: '09:20',
      durationMinutes: 20,
      type: 'consultation',
      status: 'scheduled',
      notes: 'Routine hypertension follow-up.',
    },
    {
      id: 'apt-2',
      patientId: 'pat-2',
      doctorId: 'doc-3',
      date: addDays(0),
      startTime: '10:00',
      endTime: '10:20',
      durationMinutes: 20,
      type: 'checkup',
      status: 'scheduled',
      notes: 'Annual pediatric checkup.',
    },
    {
      id: 'apt-3',
      patientId: 'pat-3',
      doctorId: 'doc-1',
      date: addDays(0),
      startTime: '11:00',
      endTime: '11:20',
      durationMinutes: 20,
      type: 'follow-up',
      status: 'completed',
      notes: 'Diabetes management review.',
    },
    {
      id: 'apt-4',
      patientId: 'pat-4',
      doctorId: 'doc-6',
      date: addDays(0),
      startTime: '09:15',
      endTime: '09:30',
      durationMinutes: 15,
      type: 'consultation',
      status: 'cancelled',
      notes: 'Patient requested reschedule.',
    },
    {
      id: 'apt-5',
      patientId: 'pat-6',
      doctorId: 'doc-5',
      date: addDays(0),
      startTime: '15:00',
      endTime: '15:20',
      durationMinutes: 20,
      type: 'checkup',
      status: 'completed',
      notes: 'Second trimester prenatal checkup.',
    },
    {
      id: 'apt-6',
      patientId: 'pat-1',
      doctorId: 'doc-6',
      date: addDays(1),
      startTime: '09:15',
      endTime: '09:30',
      durationMinutes: 15,
      type: 'follow-up',
      status: 'scheduled',
      notes: '',
    },
    {
      id: 'apt-7',
      patientId: 'pat-8',
      doctorId: 'doc-3',
      date: addDays(3),
      startTime: '10:00',
      endTime: '10:20',
      durationMinutes: 20,
      type: 'consultation',
      status: 'scheduled',
      notes: 'Nut allergy follow-up.',
    },
    {
      id: 'apt-8',
      patientId: 'pat-2',
      doctorId: 'doc-2',
      date: addDays(5),
      startTime: '09:15',
      endTime: '09:30',
      durationMinutes: 15,
      type: 'procedure',
      status: 'scheduled',
      notes: '',
    },
    {
      id: 'apt-9',
      patientId: 'pat-3',
      doctorId: 'doc-5',
      date: addDays(-2),
      startTime: '14:00',
      endTime: '14:20',
      durationMinutes: 20,
      type: 'consultation',
      status: 'completed',
      notes: 'Initial diabetes consultation.',
    },
    {
      id: 'apt-10',
      patientId: 'pat-6',
      doctorId: 'doc-1',
      date: addDays(-1),
      startTime: '10:00',
      endTime: '10:20',
      durationMinutes: 20,
      type: 'consultation',
      status: 'cancelled',
      notes: 'Patient was unwell, rebooking separately.',
    },
  ];

  return base.map((appointment) => ({ ...appointment, createdAt: now, updatedAt: now }));
}

/**
 * Sprint 5 has no backend, so all data lives in the `_appointments` signal -
 * same signal-plus-Observable split as `DoctorService`/`PatientService`.
 * Reuses `DoctorService`/`PatientService` (active checks, display names) and
 * `AvailabilityService` (slot generation, doctor-availability checks) instead
 * of re-deriving any of that here.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly availabilityService = inject(AvailabilityService);

  private readonly _appointments = signal<Appointment[]>(createMockAppointments());

  readonly appointments = this._appointments.asReadonly();

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

  private validateBooking(input: AppointmentInput, excludeAppointmentId?: string): string | null {
    const doctor = this.doctorService.doctors().find((d) => d.id === input.doctorId);
    if (!doctor || doctor.status !== 'active') {
      return 'Doctor is not active.';
    }

    const patient = this.patientService.patients().find((p) => p.id === input.patientId);
    if (!patient || patient.status !== 'active') {
      return 'Patient is not active.';
    }

    if (!this.availabilityService.isDoctorAvailableOn(input.doctorId, input.date)) {
      return 'Doctor is not available on the selected date.';
    }

    const overlaps = this._appointments().some(
      (appointment) =>
        appointment.doctorId === input.doctorId &&
        appointment.date === input.date &&
        appointment.status !== 'cancelled' &&
        appointment.id !== excludeAppointmentId &&
        doTimeRangesOverlap(
          input.startTime,
          input.endTime,
          appointment.startTime,
          appointment.endTime,
        ),
    );
    if (overlaps) {
      return 'This time slot overlaps with an existing appointment.';
    }

    return null;
  }

  getAppointments(): Observable<Appointment[]> {
    return of(this._appointments()).pipe(delay(300));
  }

  getAppointment(id: string): Observable<Appointment | undefined> {
    return of(this._appointments().find((appointment) => appointment.id === id)).pipe(delay(300));
  }

  createAppointment(input: AppointmentInput): Observable<Appointment> {
    const validationError = this.validateBooking(input);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const now = new Date().toISOString();
    const appointment: Appointment = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(appointment).pipe(
      delay(300),
      tap((created) => this._appointments.update((appointments) => [...appointments, created])),
    );
  }

  updateAppointment(id: string, input: AppointmentInput): Observable<Appointment> {
    const existing = this._appointments().find((appointment) => appointment.id === id);
    if (!existing) {
      return throwError(() => new Error(`Appointment "${id}" was not found.`));
    }

    const validationError = this.validateBooking(input, id);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const updated: Appointment = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((appointment) =>
        this._appointments.update((appointments) =>
          appointments.map((a) => (a.id === id ? appointment : a)),
        ),
      ),
    );
  }

  private setStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    const existing = this._appointments().find((appointment) => appointment.id === id);
    if (!existing) {
      return throwError(() => new Error(`Appointment "${id}" was not found.`));
    }

    const updated: Appointment = { ...existing, status, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
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

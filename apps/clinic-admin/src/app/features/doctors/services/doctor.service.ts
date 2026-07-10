import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Doctor, DoctorInput } from '../models/doctor.model';

/**
 * Sprint 12 replaces the Sprint 2 mock data with the real Doctors API
 * (apps/api-server's DoctorsModule, mounted at `${apiBaseUrl}/doctors`). The
 * public shape - a readonly `doctors` signal, a `doctorCount` computed, and
 * five Observable-returning CRUD methods - is unchanged from the mock, so
 * every consumer (doctor-list, doctor-add, doctor-edit, doctor-details, the
 * dashboard stat card, AvailabilityService, AppointmentService,
 * KnowledgeBaseService's Doctor Profiles) keeps working with no changes of
 * its own; only this file's method bodies moved from `of(...)` to
 * `HttpClient` calls. The initial `doctors` fetch happens once, from the
 * constructor, and `set()`s the signal when it resolves - the same handoff
 * the original mock's doc comment already described.
 */
@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/doctors`;

  private readonly _doctors = signal<Doctor[]>([]);

  readonly doctors = this._doctors.asReadonly();
  readonly doctorCount = computed(() => this._doctors().length);

  constructor() {
    this.getDoctors().subscribe();
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.baseUrl).pipe(tap((doctors) => this._doctors.set(doctors)));
  }

  getDoctor(id: string): Observable<Doctor | undefined> {
    return this.http.get<Doctor>(`${this.baseUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === 404 ? of(undefined) : throwError(() => error),
      ),
    );
  }

  createDoctor(input: DoctorInput): Observable<Doctor> {
    return this.http
      .post<Doctor>(this.baseUrl, input)
      .pipe(tap((created) => this._doctors.update((doctors) => [...doctors, created])));
  }

  updateDoctor(id: string, input: DoctorInput): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.baseUrl}/${id}`, input).pipe(
      tap((updated) =>
        this._doctors.update((doctors) => doctors.map((d) => (d.id === id ? updated : d))),
      ),
    );
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._doctors.update((doctors) => doctors.filter((d) => d.id !== id))));
  }
}

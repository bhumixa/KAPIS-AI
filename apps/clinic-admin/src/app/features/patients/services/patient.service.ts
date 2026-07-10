import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Patient, PatientInput } from '../models/patient.model';

/**
 * Sprint 13 replaces the Sprint 4 mock data with the real Patients API
 * (apps/api-server's PatientsModule, mounted at `${apiBaseUrl}/patients`) - same
 * signal-plus-Observable shape and the same swap DoctorService made in Sprint 12:
 * only this file's method bodies moved from `of(...)` to `HttpClient` calls, so
 * every consumer (patient-list, patient-add, patient-edit, patient-details, the
 * dashboard stat card, AppointmentService) keeps working unchanged.
 */
@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients`;

  private readonly _patients = signal<Patient[]>([]);

  readonly patients = this._patients.asReadonly();
  readonly patientCount = computed(() => this._patients().length);

  constructor() {
    this.getPatients().subscribe();
  }

  getPatients(): Observable<Patient[]> {
    return this.http
      .get<Patient[]>(this.baseUrl)
      .pipe(tap((patients) => this._patients.set(patients)));
  }

  getPatient(id: string): Observable<Patient | undefined> {
    return this.http
      .get<Patient>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  createPatient(input: PatientInput): Observable<Patient> {
    return this.http
      .post<Patient>(this.baseUrl, input)
      .pipe(tap((created) => this._patients.update((patients) => [...patients, created])));
  }

  updatePatient(id: string, input: PatientInput): Observable<Patient> {
    return this.http
      .patch<Patient>(`${this.baseUrl}/${id}`, input)
      .pipe(
        tap((updated) =>
          this._patients.update((patients) => patients.map((p) => (p.id === id ? updated : p))),
        ),
      );
  }

  deletePatient(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this._patients.update((patients) => patients.filter((p) => p.id !== id))));
  }
}

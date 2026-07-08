import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { Doctor, DoctorInput } from '../models/doctor.model';

function createMockDoctors(): Doctor[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'doc-1',
      firstName: 'Aisha',
      lastName: 'Khan',
      gender: 'female',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology)',
      experienceYears: 12,
      registrationNumber: 'MCI-10234',
      phone: '+91 98765 43210',
      email: 'aisha.khan@kapis.clinic',
      consultationFee: 900,
      consultationDuration: 20,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'doc-2',
      firstName: 'Rohan',
      lastName: 'Mehta',
      gender: 'male',
      specialization: 'Dermatologist',
      qualification: 'MBBS, MD (Dermatology)',
      experienceYears: 8,
      registrationNumber: 'MCI-10567',
      phone: '+91 98765 43211',
      email: 'rohan.mehta@kapis.clinic',
      consultationFee: 700,
      consultationDuration: 15,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'doc-3',
      firstName: 'Priya',
      lastName: 'Nair',
      gender: 'female',
      specialization: 'Pediatrician',
      qualification: 'MBBS, DCH',
      experienceYears: 15,
      registrationNumber: 'MCI-10891',
      phone: '+91 98765 43212',
      email: 'priya.nair@kapis.clinic',
      consultationFee: 600,
      consultationDuration: 20,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'doc-4',
      firstName: 'Vikram',
      lastName: 'Singh',
      gender: 'male',
      specialization: 'Orthopedic',
      qualification: 'MBBS, MS (Ortho)',
      experienceYears: 20,
      registrationNumber: 'MCI-11023',
      phone: '+91 98765 43213',
      email: 'vikram.singh@kapis.clinic',
      consultationFee: 1000,
      consultationDuration: 30,
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'doc-5',
      firstName: 'Sara',
      lastName: 'Fernandes',
      gender: 'female',
      specialization: 'Gynecologist',
      qualification: 'MBBS, MD (OBG)',
      experienceYears: 10,
      registrationNumber: 'MCI-11345',
      phone: '+91 98765 43214',
      email: 'sara.fernandes@kapis.clinic',
      consultationFee: 800,
      consultationDuration: 20,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'doc-6',
      firstName: 'Arjun',
      lastName: 'Rao',
      gender: 'male',
      specialization: 'General Physician',
      qualification: 'MBBS',
      experienceYears: 6,
      registrationNumber: 'MCI-11678',
      phone: '+91 98765 43215',
      email: 'arjun.rao@kapis.clinic',
      consultationFee: 400,
      consultationDuration: 15,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Sprint 2 has no backend, so all data lives in the `_doctors` signal, seeded
 * once from mock data. The five methods below already return Observables
 * shaped like a future `HttpClient` call (`getDoctors()` -> GET, etc.) so
 * swapping the body for a real HTTP request later won't ripple into any
 * component - only this file changes. The public `doctors`/`doctorCount`
 * signals stay in place either way (a real implementation would `set()` them
 * once the initial GET resolves), which is what lets the doctor list and the
 * dashboard stat card react immediately to creates/updates/deletes.
 */
@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly _doctors = signal<Doctor[]>(createMockDoctors());

  readonly doctors = this._doctors.asReadonly();
  readonly doctorCount = computed(() => this._doctors().length);

  getDoctors(): Observable<Doctor[]> {
    return of(this._doctors()).pipe(delay(300));
  }

  getDoctor(id: string): Observable<Doctor | undefined> {
    return of(this._doctors().find((doctor) => doctor.id === id)).pipe(delay(300));
  }

  createDoctor(input: DoctorInput): Observable<Doctor> {
    const now = new Date().toISOString();
    const doctor: Doctor = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(doctor).pipe(
      delay(300),
      tap((created) => this._doctors.update((doctors) => [...doctors, created])),
    );
  }

  updateDoctor(id: string, input: DoctorInput): Observable<Doctor> {
    const existing = this._doctors().find((doctor) => doctor.id === id);

    if (!existing) {
      return throwError(() => new Error(`Doctor "${id}" was not found.`));
    }

    const updated: Doctor = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((doctor) =>
        this._doctors.update((doctors) => doctors.map((d) => (d.id === id ? doctor : d))),
      ),
    );
  }

  deleteDoctor(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._doctors.update((doctors) => doctors.filter((doctor) => doctor.id !== id))),
    );
  }
}

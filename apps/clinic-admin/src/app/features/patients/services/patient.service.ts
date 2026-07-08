import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { Patient, PatientInput } from '../models/patient.model';

function createMockPatients(): Patient[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'pat-1',
      firstName: 'Meera',
      lastName: 'Shah',
      gender: 'female',
      dateOfBirth: '1990-04-12',
      mobileNumber: '+91 90123 45601',
      whatsappNumber: '+91 90123 45601',
      email: 'meera.shah@example.com',
      bloodGroup: 'B+',
      address: '12 Lotus Apartments, Andheri West, Mumbai',
      emergencyContact: { name: 'Raj Shah', relationship: 'Husband', phone: '+91 90123 45699' },
      allergies: 'Penicillin',
      medicalNotes: 'Mild hypertension, on regular monitoring.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-2',
      firstName: 'Aarav',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '2016-08-30',
      mobileNumber: '+91 90123 45602',
      whatsappNumber: '+91 90123 45688',
      email: 'aarav.parent@example.com',
      bloodGroup: 'O+',
      address: '45 Green Valley Society, Satellite, Ahmedabad',
      emergencyContact: {
        name: 'Nisha Patel',
        relationship: 'Mother',
        phone: '+91 90123 45688',
      },
      allergies: 'None known',
      medicalNotes: 'Routine pediatric checkups only.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-3',
      firstName: 'Ibrahim',
      lastName: 'Sheikh',
      gender: 'male',
      dateOfBirth: '1975-01-05',
      mobileNumber: '+91 90123 45603',
      whatsappNumber: '+91 90123 45603',
      email: 'ibrahim.sheikh@example.com',
      bloodGroup: 'AB-',
      address: '7 Marine Drive, Colaba, Mumbai',
      emergencyContact: { name: 'Fatima Sheikh', relationship: 'Wife', phone: '+91 90123 45677' },
      allergies: 'Sulfa drugs',
      medicalNotes: 'Type 2 diabetes, insulin dependent.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-4',
      firstName: 'Kavya',
      lastName: 'Reddy',
      gender: 'female',
      dateOfBirth: '2001-11-20',
      mobileNumber: '+91 90123 45604',
      whatsappNumber: '+91 90123 45604',
      email: 'kavya.reddy@example.com',
      bloodGroup: 'A+',
      address: '23 Jubilee Hills, Hyderabad',
      emergencyContact: {
        name: 'Suresh Reddy',
        relationship: 'Father',
        phone: '+91 90123 45666',
      },
      allergies: 'None known',
      medicalNotes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-5',
      firstName: 'Devendra',
      lastName: 'Joshi',
      gender: 'male',
      dateOfBirth: '1958-06-15',
      mobileNumber: '+91 90123 45605',
      whatsappNumber: '+91 90123 45605',
      email: 'devendra.joshi@example.com',
      bloodGroup: 'O-',
      address: '9 Shivaji Nagar, Pune',
      emergencyContact: { name: 'Anita Joshi', relationship: 'Daughter', phone: '+91 90123 45655' },
      allergies: 'Aspirin',
      medicalNotes: 'Post cardiac bypass, on regular follow-up.',
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-6',
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      gender: 'female',
      dateOfBirth: '1995-02-28',
      mobileNumber: '+91 90123 45606',
      whatsappNumber: '+91 90123 45606',
      email: 'sneha.kulkarni@example.com',
      bloodGroup: 'B-',
      address: '18 FC Road, Pune',
      emergencyContact: {
        name: 'Ramesh Kulkarni',
        relationship: 'Father',
        phone: '+91 90123 45644',
      },
      allergies: 'Latex',
      medicalNotes: 'Currently pregnant, second trimester.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-7',
      firstName: 'Farhan',
      lastName: 'Ali',
      gender: 'male',
      dateOfBirth: '1988-09-09',
      mobileNumber: '+91 90123 45607',
      whatsappNumber: '+91 90123 45633',
      email: 'farhan.ali@example.com',
      bloodGroup: 'AB+',
      address: '3 Park Street, Kolkata',
      emergencyContact: { name: 'Zara Ali', relationship: 'Sister', phone: '+91 90123 45622' },
      allergies: 'None known',
      medicalNotes: '',
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pat-8',
      firstName: 'Ananya',
      lastName: 'Iyer',
      gender: 'female',
      dateOfBirth: '2010-12-01',
      mobileNumber: '+91 90123 45608',
      whatsappNumber: '+91 90123 45611',
      email: 'ananya.parent@example.com',
      bloodGroup: 'unknown',
      address: '56 Indiranagar, Bengaluru',
      emergencyContact: { name: 'Lakshmi Iyer', relationship: 'Mother', phone: '+91 90123 45611' },
      allergies: 'Peanuts',
      medicalNotes: 'Carries an EpiPen for nut allergy.',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Sprint 4 has no backend, so all data lives in the `_patients` signal, seeded
 * once from mock data - same signal-plus-Observable split as `DoctorService`,
 * so the eventual `HttpClient` swap only touches this file.
 */
@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly _patients = signal<Patient[]>(createMockPatients());

  readonly patients = this._patients.asReadonly();
  readonly patientCount = computed(() => this._patients().length);

  getPatients(): Observable<Patient[]> {
    return of(this._patients()).pipe(delay(300));
  }

  getPatient(id: string): Observable<Patient | undefined> {
    return of(this._patients().find((patient) => patient.id === id)).pipe(delay(300));
  }

  createPatient(input: PatientInput): Observable<Patient> {
    const now = new Date().toISOString();
    const patient: Patient = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    return of(patient).pipe(
      delay(300),
      tap((created) => this._patients.update((patients) => [...patients, created])),
    );
  }

  updatePatient(id: string, input: PatientInput): Observable<Patient> {
    const existing = this._patients().find((patient) => patient.id === id);

    if (!existing) {
      return throwError(() => new Error(`Patient "${id}" was not found.`));
    }

    const updated: Patient = { ...existing, ...input, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((patient) =>
        this._patients.update((patients) => patients.map((p) => (p.id === id ? patient : p))),
      ),
    );
  }

  deletePatient(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() =>
        this._patients.update((patients) => patients.filter((patient) => patient.id !== id)),
      ),
    );
  }
}

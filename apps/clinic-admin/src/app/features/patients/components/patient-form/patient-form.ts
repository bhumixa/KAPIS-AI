import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BLOOD_GROUPS, Patient, PatientInput } from '../../models/patient.model';

const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;

function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  return (control.value as string) > today ? { futureDate: true } : null;
}

/**
 * Shared reactive form for both Add Patient and Edit Patient, same split as
 * `DoctorForm`: the parent page owns create-vs-update, this component only
 * validates and emits a strongly-typed `PatientInput`.
 */
@Component({
  selector: 'app-patient-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly patient = input<Patient | null>(null);
  readonly submitLabel = input('Save Patient');
  readonly isSaving = input(false);

  readonly save = output<PatientInput>();
  readonly cancelled = output<void>();

  readonly bloodGroups = BLOOD_GROUPS;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    gender: ['male' as Patient['gender'], [Validators.required]],
    dateOfBirth: ['', [Validators.required, notFutureDateValidator]],
    mobileNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    whatsappNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    bloodGroup: ['unknown' as Patient['bloodGroup'], [Validators.required]],
    address: ['', [Validators.required]],
    emergencyContact: this.formBuilder.nonNullable.group({
      name: ['', [Validators.required]],
      relationship: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    }),
    allergies: [''],
    medicalNotes: [''],
    status: ['active' as Patient['status'], [Validators.required]],
  });

  constructor() {
    effect(() => {
      const patient = this.patient();
      if (patient) {
        this.form.patchValue(patient);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.getRawValue());
  }
}

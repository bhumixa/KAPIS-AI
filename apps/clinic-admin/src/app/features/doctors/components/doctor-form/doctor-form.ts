import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Doctor, DoctorInput } from '../../models/doctor.model';

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedic',
  'Gynecologist',
  'ENT Specialist',
  'Neurologist',
  'Psychiatrist',
  'Dentist',
] as const;

const MIN_CONSULTATION_DURATION_MINUTES = 10;

/**
 * Shared reactive form for both Add Doctor and Edit Doctor. The parent page
 * owns what happens on submit (create vs. update), so this component only
 * validates input and emits a strongly-typed `DoctorInput` payload.
 */
@Component({
  selector: 'app-doctor-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './doctor-form.html',
  styleUrl: './doctor-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly doctor = input<Doctor | null>(null);
  readonly submitLabel = input('Save Doctor');
  readonly isSaving = input(false);

  readonly save = output<DoctorInput>();
  readonly cancelled = output<void>();

  readonly specializations = SPECIALIZATIONS;
  readonly minConsultationDuration = MIN_CONSULTATION_DURATION_MINUTES;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    gender: ['male' as Doctor['gender'], [Validators.required]],
    specialization: ['', [Validators.required]],
    qualification: ['', [Validators.required]],
    experienceYears: [0, [Validators.required, Validators.min(0)]],
    registrationNumber: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    email: ['', [Validators.required, Validators.email]],
    consultationFee: [0, [Validators.required, Validators.min(1)]],
    consultationDuration: [
      MIN_CONSULTATION_DURATION_MINUTES,
      [Validators.required, Validators.min(MIN_CONSULTATION_DURATION_MINUTES)],
    ],
    status: ['active' as Doctor['status'], [Validators.required]],
  });

  constructor() {
    effect(() => {
      const doctor = this.doctor();
      if (doctor) {
        this.form.patchValue(doctor);
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

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicService } from '../../services/clinic.service';
import {
  CURRENCIES,
  ClinicProfileInput,
  LANGUAGES,
  TIME_ZONES,
} from '../../models/clinic-profile.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';

@Component({
  selector: 'app-clinic-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SettingsNav,
  ],
  templateUrl: './clinic-profile.html',
  styleUrl: './clinic-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicProfilePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clinicService = inject(ClinicService);
  private readonly snackBar = inject(MatSnackBar);

  readonly timeZones = TIME_ZONES;
  readonly currencies = CURRENCIES;
  readonly languages = LANGUAGES;
  readonly isSaving = signal(false);

  readonly profile = toSignal(this.clinicService.getClinicProfile(), { initialValue: undefined });

  readonly form = this.formBuilder.nonNullable.group({
    clinicName: ['', Validators.required],
    logoUrl: [''],
    registrationNumber: ['', Validators.required],
    taxId: [''],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    postalCode: ['', Validators.required],
    // A clinic's front-desk number is often a landline with an area code
    // ("+91 22 4000 1234", 16 chars), longer than the {7,15} mobile-number
    // pattern doctor-form/patient-form use - widened here to fit that format.
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    website: [''],
    timeZone: ['Asia/Kolkata', Validators.required],
    currency: ['INR', Validators.required],
    language: ['English', Validators.required],
  });

  constructor() {
    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.form.patchValue(profile);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const input: ClinicProfileInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.clinicService.updateClinicProfile(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('Clinic profile saved.', 'Dismiss', { duration: 3000 });
    });
  }
}

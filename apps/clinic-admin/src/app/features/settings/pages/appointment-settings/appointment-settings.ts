import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from '../../services/settings.service';
import { AppointmentSettingsInput } from '../../models/appointment-settings.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';

@Component({
  selector: 'app-appointment-settings',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    SettingsNav,
  ],
  templateUrl: './appointment-settings.html',
  styleUrl: './appointment-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentSettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);
  readonly settings = toSignal(this.settingsService.getAppointmentSettings(), {
    initialValue: undefined,
  });

  readonly form = this.formBuilder.nonNullable.group({
    defaultConsultationDuration: [20, [Validators.required, Validators.min(5)]],
    bufferBetweenAppointments: [5, [Validators.required, Validators.min(0)]],
    advanceBookingLimitDays: [30, [Validators.required, Validators.min(1)]],
    allowOnlineBooking: [true],
    cancellationWindowHours: [4, [Validators.required, Validators.min(0)]],
    rescheduleWindowHours: [4, [Validators.required, Validators.min(0)]],
    autoConfirmAppointment: [true],
    allowWalkIns: [true],
  });

  constructor() {
    effect(() => {
      const settings = this.settings();
      if (settings) {
        this.form.patchValue(settings);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const input: AppointmentSettingsInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.settingsService.updateAppointmentSettings(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('Appointment settings saved.', 'Dismiss', { duration: 3000 });
    });
  }
}

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
import { NotificationSettingsInput } from '../../models/notification-settings.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';

@Component({
  selector: 'app-notification-settings',
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
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);
  readonly settings = toSignal(this.settingsService.getNotificationSettings(), {
    initialValue: undefined,
  });

  readonly form = this.formBuilder.nonNullable.group({
    emailNotifications: [true],
    whatsappNotifications: [false],
    appointmentReminder: [true],
    reminderTimeHours: [24, [Validators.required, Validators.min(1)]],
    welcomeMessage: [''],
    cancellationMessage: [''],
    followUpReminder: [false],
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

    const input: NotificationSettingsInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.settingsService.updateNotificationSettings(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('Notification settings saved.', 'Dismiss', { duration: 3000 });
    });
  }
}

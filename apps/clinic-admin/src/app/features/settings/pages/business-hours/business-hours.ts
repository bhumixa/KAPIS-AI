import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicService } from '../../services/clinic.service';
import { BusinessHoursInput } from '../../models/business-hours.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';
import { BusinessHoursEditor } from '../../components/business-hours-editor/business-hours-editor';

@Component({
  selector: 'app-business-hours',
  imports: [MatCardModule, SettingsNav, BusinessHoursEditor],
  templateUrl: './business-hours.html',
  styleUrl: './business-hours.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessHoursPage {
  private readonly clinicService = inject(ClinicService);
  private readonly snackBar = inject(MatSnackBar);

  readonly businessHours = toSignal(this.clinicService.getBusinessHours(), {
    initialValue: null,
  });
  readonly isSaving = signal(false);

  save(input: BusinessHoursInput): void {
    this.isSaving.set(true);

    this.clinicService.updateBusinessHours(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('Business hours saved.', 'Dismiss', { duration: 3000 });
    });
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { ClinicHoliday, ClinicHolidayInput } from '../../models/clinic-holiday.model';

export interface HolidayFormDialogData {
  holiday: ClinicHoliday | null;
}

/** Self-contained dialog, same shape as `LeaveForm` - opened directly via `MatDialog.open(HolidayForm, ...)`. */
@Component({
  selector: 'app-holiday-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './holiday-form.html',
  styleUrl: './holiday-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HolidayForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<HolidayForm, ClinicHolidayInput>);
  readonly data = inject<HolidayFormDialogData>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.holiday?.name ?? '', Validators.required],
    date: [this.data.holiday?.date ?? '', Validators.required],
    recurringYearly: [this.data.holiday?.recurringYearly ?? false],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

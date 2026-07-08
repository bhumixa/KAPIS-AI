import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DoctorService } from '../../services/doctor.service';
import {
  DoctorLeave,
  DoctorLeaveInput,
  LEAVE_TYPE_LABELS,
  LeaveType,
} from '../../models/doctor-leave.model';

export interface LeaveFormDialogData {
  leave: DoctorLeave | null;
}

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end = group.get('endDate')?.value as string;
  return start && end && end < start ? { dateRange: true } : null;
}

/** Self-contained dialog, same shape as `DoctorDeleteDialog`/`ConfirmDialog` - opened directly via `MatDialog.open(LeaveForm, ...)`. */
@Component({
  selector: 'app-leave-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './leave-form.html',
  styleUrl: './leave-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LeaveForm, DoctorLeaveInput>);
  private readonly doctorService = inject(DoctorService);
  readonly data = inject<LeaveFormDialogData>(MAT_DIALOG_DATA);

  readonly doctors = this.doctorService.doctors;
  readonly leaveTypes = Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][];

  readonly form = this.formBuilder.nonNullable.group(
    {
      doctorId: [this.data.leave?.doctorId ?? '', Validators.required],
      type: [this.data.leave?.type ?? ('vacation' as LeaveType), Validators.required],
      startDate: [this.data.leave?.startDate ?? '', Validators.required],
      endDate: [this.data.leave?.endDate ?? '', Validators.required],
      reason: [this.data.leave?.reason ?? '', Validators.required],
    },
    { validators: dateRangeValidator },
  );

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

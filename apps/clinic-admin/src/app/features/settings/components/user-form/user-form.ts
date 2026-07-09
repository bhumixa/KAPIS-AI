import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ClinicUser, ClinicUserInput, USER_ROLES, UserRole } from '../../models/clinic-user.model';

const PHONE_PATTERN = /^[0-9+\-\s]{7,15}$/;

export interface UserFormDialogData {
  user: ClinicUser | null;
}

/** Self-contained dialog, same shape as `LeaveForm`/`HolidayForm` - opened directly via `MatDialog.open(UserForm, ...)`. */
@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserForm, ClinicUserInput>);
  readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);

  readonly roles = USER_ROLES;

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.user?.name ?? '', Validators.required],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data.user?.phone ?? '', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    role: [this.data.user?.role ?? ('receptionist' as UserRole), Validators.required],
    status: [this.data.user?.status ?? 'active', Validators.required],
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

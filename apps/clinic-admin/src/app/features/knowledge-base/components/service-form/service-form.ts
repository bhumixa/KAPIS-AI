import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ClinicService, ClinicServiceInput } from '../../models/service.model';

export interface ServiceFormDialogData {
  service: ClinicService | null;
}

/** Self-contained dialog, same shape as `UserForm`. */
@Component({
  selector: 'app-service-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ServiceForm, ClinicServiceInput>);
  readonly data = inject<ServiceFormDialogData>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.service?.name ?? '', Validators.required],
    category: [this.data.service?.category ?? '', Validators.required],
    description: [this.data.service?.description ?? ''],
    durationMinutes: [
      this.data.service?.durationMinutes ?? 15,
      [Validators.required, Validators.min(1)],
    ],
    price: [this.data.service?.price ?? 0, [Validators.required, Validators.min(0)]],
    status: [this.data.service?.status ?? 'active', Validators.required],
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

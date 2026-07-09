import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { InsuranceProvider, InsuranceProviderInput } from '../../models/insurance-provider.model';

const PHONE_PATTERN = /^[0-9+\-\s]{7,20}$/;

export interface InsuranceProviderFormDialogData {
  provider: InsuranceProvider | null;
}

/** Self-contained dialog, same shape as `UserForm`. */
@Component({
  selector: 'app-insurance-provider-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './insurance-provider-form.html',
  styleUrl: './insurance-provider-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceProviderForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InsuranceProviderForm, InsuranceProviderInput>);
  readonly data = inject<InsuranceProviderFormDialogData>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.provider?.name ?? '', Validators.required],
    contactPerson: [this.data.provider?.contactPerson ?? ''],
    phone: [this.data.provider?.phone ?? '', Validators.pattern(PHONE_PATTERN)],
    email: [this.data.provider?.email ?? '', Validators.email],
    website: [this.data.provider?.website ?? ''],
    status: [this.data.provider?.status ?? 'active', Validators.required],
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

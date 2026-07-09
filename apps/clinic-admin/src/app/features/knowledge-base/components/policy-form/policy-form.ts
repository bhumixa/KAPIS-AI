import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Policy, PolicyInput, PolicyType, POLICY_TYPES } from '../../models/policy.model';

export interface PolicyFormDialogData {
  policy: Policy | null;
}

/** Self-contained dialog, same shape as `UserForm`. */
@Component({
  selector: 'app-policy-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './policy-form.html',
  styleUrl: './policy-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PolicyForm, PolicyInput>);
  readonly data = inject<PolicyFormDialogData>(MAT_DIALOG_DATA);

  readonly types = POLICY_TYPES;

  readonly form = this.formBuilder.nonNullable.group({
    title: [this.data.policy?.title ?? '', Validators.required],
    type: [this.data.policy?.type ?? ('cancellation' as PolicyType), Validators.required],
    content: [this.data.policy?.content ?? '', Validators.required],
    status: [this.data.policy?.status ?? 'active', Validators.required],
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

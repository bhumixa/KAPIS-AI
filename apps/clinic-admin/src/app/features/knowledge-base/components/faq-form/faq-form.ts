import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Faq, FaqInput } from '../../models/faq.model';

export interface FaqFormDialogData {
  faq: Faq | null;
}

/** Self-contained dialog, same shape as `UserForm`. */
@Component({
  selector: 'app-faq-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './faq-form.html',
  styleUrl: './faq-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FaqForm, FaqInput>);
  readonly data = inject<FaqFormDialogData>(MAT_DIALOG_DATA);

  readonly form = this.formBuilder.nonNullable.group({
    question: [this.data.faq?.question ?? '', Validators.required],
    answer: [this.data.faq?.answer ?? '', Validators.required],
    category: [this.data.faq?.category ?? '', Validators.required],
    status: [this.data.faq?.status ?? 'draft', Validators.required],
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

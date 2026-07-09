import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {
  MessageTemplate,
  MessageTemplateInput,
  MessageTemplateType,
  MESSAGE_TEMPLATE_TYPES,
  MESSAGE_TEMPLATE_TYPE_LABELS,
} from '../../models/message-template.model';

export interface MessageTemplateFormDialogData {
  template: MessageTemplate | null;
}

function toVariablesText(variables: string[]): string {
  return variables.join(', ');
}

function fromVariablesText(text: string): string[] {
  return text
    .split(',')
    .map((variable) => variable.trim())
    .filter((variable) => variable.length > 0);
}

/** Self-contained dialog, same shape as `UserForm`. `variables` is edited as a comma-separated list rather than a chip editor - the field is a flat list of merge-field names with no need for a richer UI yet. */
@Component({
  selector: 'app-message-template-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './message-template-form.html',
  styleUrl: './message-template-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTemplateForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MessageTemplateForm, MessageTemplateInput>);
  readonly data = inject<MessageTemplateFormDialogData>(MAT_DIALOG_DATA);

  readonly types = MESSAGE_TEMPLATE_TYPES;
  readonly typeLabels = MESSAGE_TEMPLATE_TYPE_LABELS;

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.template?.name ?? '', Validators.required],
    type: [
      this.data.template?.type ?? ('appointment_confirmation' as MessageTemplateType),
      Validators.required,
    ],
    subject: [this.data.template?.subject ?? '', Validators.required],
    body: [this.data.template?.body ?? '', Validators.required],
    variablesText: [toVariablesText(this.data.template?.variables ?? [])],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { variablesText, ...rest } = this.form.getRawValue();
    const input: MessageTemplateInput = { ...rest, variables: fromVariablesText(variablesText) };
    this.dialogRef.close(input);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

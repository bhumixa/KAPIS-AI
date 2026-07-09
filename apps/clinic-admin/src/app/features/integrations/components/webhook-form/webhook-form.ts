import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Webhook, WebhookInput, WEBHOOK_EVENTS } from '../../models/webhook.model';

export interface WebhookFormDialogData {
  webhook: Webhook | null;
}

/** Self-contained dialog, same shape as `UserForm`. `events` is a fixed-vocabulary multi-select, not free text - webhooks fire on real system event names, so typos would silently break delivery. */
@Component({
  selector: 'app-webhook-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './webhook-form.html',
  styleUrl: './webhook-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebhookForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<WebhookForm, WebhookInput>);
  readonly data = inject<WebhookFormDialogData>(MAT_DIALOG_DATA);

  readonly events = WEBHOOK_EVENTS;

  readonly form = this.formBuilder.nonNullable.group({
    name: [this.data.webhook?.name ?? '', Validators.required],
    url: [this.data.webhook?.url ?? '', [Validators.required, Validators.pattern(/^https?:\/\//)]],
    secret: [this.data.webhook?.secret ?? '', Validators.required],
    status: [this.data.webhook?.status ?? 'active', Validators.required],
    events: [this.data.webhook?.events ?? [], Validators.required],
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

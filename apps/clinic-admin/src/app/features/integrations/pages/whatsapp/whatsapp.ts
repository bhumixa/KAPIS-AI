import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntegrationService } from '../../services/integration.service';
import { WhatsAppIntegrationInput } from '../../models/whatsapp-integration.model';
import { IntegrationsNav } from '../../components/integrations-nav/integrations-nav';
import { IntegrationStatusChip } from '../../components/integration-status-chip/integration-status-chip';

@Component({
  selector: 'app-whatsapp',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    IntegrationsNav,
    IntegrationStatusChip,
  ],
  templateUrl: './whatsapp.html',
  styleUrl: './whatsapp.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsApp {
  private readonly formBuilder = inject(FormBuilder);
  private readonly integrationService = inject(IntegrationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);
  readonly isTesting = signal(false);
  readonly integration = toSignal(this.integrationService.getWhatsAppIntegration(), {
    initialValue: undefined,
  });
  readonly status = this.integrationService.whatsapp;

  readonly form = this.formBuilder.nonNullable.group({
    businessNumber: [''],
    phoneNumberId: [''],
    wabaId: [''],
    accessToken: [''],
    verifyToken: [''],
    webhookUrl: [''],
  });

  constructor() {
    effect(() => {
      const integration = this.integration();
      if (integration) {
        this.form.patchValue(integration);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const input: WhatsAppIntegrationInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.integrationService.updateWhatsAppIntegration(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('WhatsApp integration saved.', 'Dismiss', { duration: 3000 });
    });
  }

  testConnection(): void {
    if (this.isTesting()) {
      return;
    }

    this.isTesting.set(true);

    this.integrationService.testWhatsAppConnection().subscribe((result) => {
      this.isTesting.set(false);
      this.snackBar.open(result.message, 'Dismiss', { duration: 3000 });
    });
  }
}

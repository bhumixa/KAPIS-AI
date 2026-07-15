import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IntegrationService } from '../../services/integration.service';
import { ClaudeIntegrationInput } from '../../models/claude-integration.model';
import { IntegrationsNav } from '../../components/integrations-nav/integrations-nav';
import { IntegrationStatusChip } from '../../components/integration-status-chip/integration-status-chip';

@Component({
  selector: 'app-claude',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    IntegrationsNav,
    IntegrationStatusChip,
  ],
  templateUrl: './claude.html',
  styleUrl: './claude.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Claude {
  private readonly formBuilder = inject(FormBuilder);
  private readonly integrationService = inject(IntegrationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);
  readonly isTesting = signal(false);
  readonly integration = toSignal(this.integrationService.getClaudeIntegration(), {
    initialValue: undefined,
  });
  readonly status = this.integrationService.claude;

  readonly form = this.formBuilder.nonNullable.group({
    model: ['gemini-2.5-flash', Validators.required],
    maxTokens: [1024, [Validators.required, Validators.min(1)]],
    temperature: [0.4, [Validators.required, Validators.min(0), Validators.max(1)]],
    enabled: [false],
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

    const input: ClaudeIntegrationInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.integrationService.updateClaudeIntegration(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('Gemini integration saved.', 'Dismiss', { duration: 3000 });
    });
  }

  testConnection(): void {
    if (this.isTesting()) {
      return;
    }

    this.isTesting.set(true);

    this.integrationService.testClaudeConnection().subscribe((result) => {
      this.isTesting.set(false);
      this.snackBar.open(result.message, 'Dismiss', { duration: 3000 });
    });
  }
}

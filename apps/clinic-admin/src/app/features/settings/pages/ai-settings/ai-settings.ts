import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from '../../services/settings.service';
import { AISettingsInput, AI_PROVIDERS, AIProvider } from '../../models/ai-settings.model';
import { SettingsNav } from '../../components/settings-nav/settings-nav';

@Component({
  selector: 'app-ai-settings',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    SettingsNav,
  ],
  templateUrl: './ai-settings.html',
  styleUrl: './ai-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly providers = AI_PROVIDERS;
  readonly isSaving = signal(false);
  readonly settings = toSignal(this.settingsService.getAiSettings(), { initialValue: undefined });

  readonly form = this.formBuilder.nonNullable.group({
    enabled: [false],
    provider: ['claude' as AIProvider, Validators.required],
    claudeApiKey: [''],
    openaiApiKey: [''],
    defaultModel: ['claude-sonnet-5', Validators.required],
    systemPrompt: [''],
    temperature: [0.4, [Validators.required, Validators.min(0), Validators.max(1)]],
    maxTokens: [1024, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const settings = this.settings();
      if (settings) {
        this.form.patchValue(settings);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const input: AISettingsInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.settingsService.updateAiSettings(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('AI settings saved.', 'Dismiss', { duration: 3000 });
    });
  }
}

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KnowledgeBaseService } from '../../services/knowledge-base.service';
import { AIPromptSettingsInput } from '../../models/ai-prompt-settings.model';
import { KnowledgeBaseNav } from '../../components/knowledge-base-nav/knowledge-base-nav';

@Component({
  selector: 'app-ai-prompt-settings',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    KnowledgeBaseNav,
  ],
  templateUrl: './ai-prompt-settings.html',
  styleUrl: './ai-prompt-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPromptSettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly knowledgeBaseService = inject(KnowledgeBaseService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);
  readonly settings = toSignal(this.knowledgeBaseService.getAiPromptSettings(), {
    initialValue: undefined,
  });

  readonly form = this.formBuilder.nonNullable.group({
    clinicPersonality: [''],
    tone: [''],
    greeting: [''],
    fallbackMessage: [''],
    emergencyInstructions: [''],
    escalationRules: [''],
    systemPrompt: [''],
    enabled: [false],
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
    if (this.isSaving()) {
      return;
    }

    const input: AIPromptSettingsInput = this.form.getRawValue();
    this.isSaving.set(true);

    this.knowledgeBaseService.updateAiPromptSettings(input).subscribe(() => {
      this.isSaving.set(false);
      this.snackBar.open('AI prompt settings saved.', 'Dismiss', { duration: 3000 });
    });
  }
}

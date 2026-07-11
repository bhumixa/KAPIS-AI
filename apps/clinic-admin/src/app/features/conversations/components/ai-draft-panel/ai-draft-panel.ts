import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { AiOrchestratorService } from '../../../ai/services/ai-orchestrator.service';
import { AiConversationContext } from '../../../ai/models/ai-context.model';
import { Prompt } from '../../../ai/models/prompt.model';
import { AiExecutionHistory } from '../../../ai/models/ai-execution.model';
import {
  PROMPT_TEMPLATE_TYPE_LABELS,
  PROMPT_TEMPLATE_TYPES,
  PromptTemplateType,
} from '../../../ai/models/prompt-template.model';
import { AIDraft } from '../../models/ai-draft.model';

/**
 * Sprint 17 - replaces the Sprint 9 canned-template mock with real calls to
 * apps/api-server's AIOrchestratorModule (`AiOrchestratorService`, mounted at
 * `${apiBaseUrl}/ai`): context assembly, prompt preview, and a mock "generate"
 * call, each a distinct backend step surfaced here rather than one opaque
 * "Generate" button - see AIOrchestratorService's doc comment for why the
 * pipeline is structured this way server-side. Still no external AI API is
 * ever called - AIExecutionService's response is deterministic and fake.
 */
@Component({
  selector: 'app-ai-draft-panel',
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './ai-draft-panel.html',
  styleUrl: './ai-draft-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDraftPanel {
  private readonly aiService = inject(AiOrchestratorService);
  private readonly snackBar = inject(MatSnackBar);

  readonly conversationId = input.required<string>();
  readonly accept = output<string>();

  readonly templateTypes = PROMPT_TEMPLATE_TYPES;
  readonly templateTypeLabels = PROMPT_TEMPLATE_TYPE_LABELS;
  readonly templateType = signal<PromptTemplateType>('general_question');

  readonly context = signal<AiConversationContext | null>(null);
  readonly prompt = signal<Prompt | null>(null);
  readonly history = signal<AiExecutionHistory[]>([]);
  readonly draft = signal<AIDraft>({ status: 'idle', content: '', generatedAt: null });
  readonly isEditing = signal(false);

  readonly isLoadingContext = computed(() => this.draft().status === 'loading-context');
  readonly isGenerating = computed(() => this.draft().status === 'generating');
  readonly hasContext = computed(() => this.context() !== null);
  readonly hasDraft = computed(() => this.draft().status === 'ready');

  readonly tokenUsage = computed(() => this.history()[0]?.totalTokens ?? null);
  readonly latencyMs = computed(() => this.history()[0]?.latencyMs ?? null);

  loadContext(): void {
    if (this.isLoadingContext()) {
      return;
    }

    this.draft.update((current) => ({ ...current, status: 'loading-context' }));

    this.aiService.getContext(this.conversationId()).subscribe({
      next: (context) => {
        this.context.set(context);
        this.draft.update((current) => ({ ...current, status: 'context-ready' }));
        this.refreshHistory();
      },
      error: () => {
        this.draft.update((current) => ({ ...current, status: 'idle' }));
        this.snackBar.open('Could not load conversation context.', 'Dismiss', { duration: 3000 });
      },
    });
  }

  previewPrompt(): void {
    this.aiService.getPromptPreview(this.conversationId(), this.templateType()).subscribe({
      next: (prompt) => this.prompt.set(prompt),
      error: () => {
        this.snackBar.open('Could not build a prompt preview.', 'Dismiss', { duration: 3000 });
      },
    });
  }

  generate(): void {
    if (this.isGenerating()) {
      return;
    }

    this.draft.update((current) => ({ ...current, status: 'generating' }));

    this.aiService
      .generate({ conversationId: this.conversationId(), templateType: this.templateType() })
      .subscribe({
        next: (result) => {
          this.draft.set({
            status: 'ready',
            content: result.response,
            generatedAt: new Date().toISOString(),
          });
          this.isEditing.set(false);
          this.refreshHistory();
        },
        error: (error: HttpErrorResponse) => {
          this.draft.update((current) => ({
            ...current,
            status: this.context() ? 'context-ready' : 'idle',
          }));
          const message = (error.error as { message?: string } | null)?.message;
          this.snackBar.open(message ?? 'Could not generate a reply.', 'Dismiss', {
            duration: 4000,
          });
        },
      });
  }

  regenerate(): void {
    this.generate();
  }

  toggleEdit(): void {
    this.isEditing.update((editing) => !editing);
  }

  onEditInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draft.update((current) => ({ ...current, content: value }));
  }

  acceptDraft(): void {
    const content = this.draft().content.trim();
    if (!content) {
      return;
    }

    this.accept.emit(content);
    this.draft.set({
      status: this.context() ? 'context-ready' : 'idle',
      content: '',
      generatedAt: null,
    });
    this.isEditing.set(false);
  }

  copyDraft(): void {
    const content = this.draft().content;
    if (!content) {
      return;
    }

    void navigator.clipboard.writeText(content);
    this.snackBar.open('Draft copied to clipboard.', 'Dismiss', { duration: 2000 });
  }

  private refreshHistory(): void {
    this.aiService
      .getHistory(this.conversationId(), 10)
      .subscribe((history) => this.history.set(history));
  }
}

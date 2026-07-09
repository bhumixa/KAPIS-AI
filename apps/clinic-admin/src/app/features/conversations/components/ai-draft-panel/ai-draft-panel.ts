import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { of, delay } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AIDraft } from '../../models/ai-draft.model';

/** Canned reply templates - "Generate"/"Regenerate" cycle through these locally; no AI API is ever called (Sprint 9 is mock-only). */
const DRAFT_VARIANTS: ((context: string) => string)[] = [
  (context) =>
    `Hi! Thanks for reaching out${context ? ` about "${context}"` : ''}. Let me check on that and get back to you shortly.`,
  (context) =>
    `Hello, thank you for your patience${context ? ` regarding "${context}"` : ''}. Our team is reviewing this now.`,
  (context) =>
    `Hi there! I understand your concern${context ? ` about "${context}"` : ''} - a member of our team will follow up within the hour.`,
];

const GENERATE_DELAY_MS = 900;

/**
 * Mock-only AI Draft Panel: "Generate"/"Regenerate" pick the next canned
 * template from `DRAFT_VARIANTS` and simulate latency with `of(...).pipe(delay(...))`,
 * the same async-mock idiom every service in this app uses - there is no
 * dependency on `IntegrationService`'s (also mock) Claude config, since
 * accepting or wiring a real provider is explicitly out of scope for Sprint 9.
 */
@Component({
  selector: 'app-ai-draft-panel',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai-draft-panel.html',
  styleUrl: './ai-draft-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDraftPanel {
  private readonly snackBar = inject(MatSnackBar);

  readonly lastPatientMessage = input('');

  readonly accept = output<string>();

  private readonly variantIndex = signal(0);
  readonly draft = signal<AIDraft>({ status: 'idle', content: '', generatedAt: null });
  readonly isEditing = signal(false);

  readonly isGenerating = computed(() => this.draft().status === 'generating');
  readonly hasDraft = computed(() => this.draft().status === 'ready');

  generate(): void {
    this.draft.update((current) => ({ ...current, status: 'generating' }));

    const content = DRAFT_VARIANTS[this.variantIndex()](this.lastPatientMessage());

    of(content)
      .pipe(delay(GENERATE_DELAY_MS))
      .subscribe((generated) => {
        this.draft.set({
          status: 'ready',
          content: generated,
          generatedAt: new Date().toISOString(),
        });
        this.isEditing.set(false);
      });
  }

  regenerate(): void {
    this.variantIndex.update((index) => (index + 1) % DRAFT_VARIANTS.length);
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
    this.draft.set({ status: 'idle', content: '', generatedAt: null });
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
}

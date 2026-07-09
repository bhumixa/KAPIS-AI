import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConversationNote } from '../../models/conversation-note.model';

export interface NoteUpdatePayload {
  id: string;
  body: string;
}

/** Presentational internal-notes CRUD list - the Conversation Details page owns the actual calls to `ConversationService`. */
@Component({
  selector: 'app-internal-notes',
  imports: [
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './internal-notes.html',
  styleUrl: './internal-notes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternalNotes {
  readonly notes = input.required<ConversationNote[]>();

  readonly add = output<string>();
  readonly update = output<NoteUpdatePayload>();
  readonly delete = output<ConversationNote>();

  readonly newNoteText = signal('');
  readonly editingNoteId = signal<string | null>(null);
  readonly editingText = signal('');

  onNewNoteInput(event: Event): void {
    this.newNoteText.set((event.target as HTMLTextAreaElement).value);
  }

  addNote(): void {
    const body = this.newNoteText().trim();
    if (!body) {
      return;
    }
    this.add.emit(body);
    this.newNoteText.set('');
  }

  startEdit(note: ConversationNote): void {
    this.editingNoteId.set(note.id);
    this.editingText.set(note.body);
  }

  onEditInput(event: Event): void {
    this.editingText.set((event.target as HTMLTextAreaElement).value);
  }

  saveEdit(): void {
    const id = this.editingNoteId();
    const body = this.editingText().trim();
    if (!id || !body) {
      return;
    }
    this.update.emit({ id, body });
    this.editingNoteId.set(null);
  }

  cancelEdit(): void {
    this.editingNoteId.set(null);
  }
}

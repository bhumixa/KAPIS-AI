import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Message } from '../../models/message.model';

/**
 * Presentational message timeline plus its reply composer - the composer's
 * draft text is local UI state (never persisted until "Send"), so it lives
 * here rather than in the Conversation Details page, same split
 * `FaqTable`'s internal `MatTableDataSource` uses for view-only state.
 */
@Component({
  selector: 'app-message-timeline',
  imports: [
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './message-timeline.html',
  styleUrl: './message-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTimeline {
  readonly messages = input.required<Message[]>();
  readonly sending = input(false);

  readonly send = output<string>();

  readonly draftText = signal('');

  onDraftInput(event: Event): void {
    this.draftText.set((event.target as HTMLTextAreaElement).value);
  }

  sendReply(): void {
    const body = this.draftText().trim();
    if (!body) {
      return;
    }
    this.send.emit(body);
    this.draftText.set('');
  }
}

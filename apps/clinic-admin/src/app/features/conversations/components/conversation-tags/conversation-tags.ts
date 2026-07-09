import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

/** Presentational tag editor - the Conversation Details page owns the actual add/remove calls to `ConversationService`. */
@Component({
  selector: 'app-conversation-tags',
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './conversation-tags.html',
  styleUrl: './conversation-tags.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationTags {
  readonly tags = input.required<string[]>();

  readonly add = output<string>();
  readonly remove = output<string>();

  onAdd(event: MatChipInputEvent): void {
    const value = event.value.trim();
    if (value) {
      this.add.emit(value);
    }
    event.chipInput?.clear();
  }
}

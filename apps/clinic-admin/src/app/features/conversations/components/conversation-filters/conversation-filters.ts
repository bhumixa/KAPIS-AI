import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  CONVERSATION_QUICK_FILTERS,
  CONVERSATION_QUICK_FILTER_LABELS,
  ConversationQuickFilter,
} from '../../models/conversation-quick-filter.model';

/** Presentational filter chip row - the Inbox page owns the actual filtering logic. */
@Component({
  selector: 'app-conversation-filters',
  imports: [MatButtonToggleModule],
  templateUrl: './conversation-filters.html',
  styleUrl: './conversation-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationFilters {
  readonly activeFilter = input.required<ConversationQuickFilter>();
  readonly filterChange = output<ConversationQuickFilter>();

  readonly filters = CONVERSATION_QUICK_FILTERS;
  readonly labels = CONVERSATION_QUICK_FILTER_LABELS;

  onChange(event: MatButtonToggleChange): void {
    this.filterChange.emit(event.value as ConversationQuickFilter);
  }
}

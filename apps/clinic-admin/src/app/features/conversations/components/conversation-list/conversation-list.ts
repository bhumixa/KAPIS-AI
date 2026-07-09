import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ConversationListItem } from '../../models/conversation-list-item.model';
import { CONVERSATION_STATUS_LABELS } from '../../models/conversation.model';

/**
 * Presentational contact list - the Inbox page owns search/filter state and
 * the patient/message joins. Rows are plain flex markup rather than
 * `mat-list-item` + `matListItemTitle`/`matListItemLine`: Material's list
 * directives size each row from a fixed line-count grid, which clipped and
 * overlapped the name/preview/meta rows once a status chip and assignee were
 * added as a third line - full control over the row layout was simpler than
 * fighting that grid.
 */
@Component({
  selector: 'app-conversation-list',
  imports: [DatePipe, MatChipsModule, MatIconModule],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationList {
  readonly items = input.required<ConversationListItem[]>();

  readonly open = output<ConversationListItem>();

  readonly statusLabels = CONVERSATION_STATUS_LABELS;
}

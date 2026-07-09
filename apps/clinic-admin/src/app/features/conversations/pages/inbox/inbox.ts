import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ConversationService } from '../../services/conversation.service';
import { MessageService } from '../../services/message.service';
import { ConversationAssignmentService } from '../../services/conversation-assignment.service';
import { ConversationFilters } from '../../components/conversation-filters/conversation-filters';
import { ConversationList } from '../../components/conversation-list/conversation-list';
import { ConversationListItem } from '../../models/conversation-list-item.model';
import { ConversationQuickFilter } from '../../models/conversation-quick-filter.model';
import { getInitials } from '../../../../core/utils/get-initials.util';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constant';

@Component({
  selector: 'app-inbox',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ConversationFilters,
    ConversationList,
  ],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inbox {
  private readonly conversationService = inject(ConversationService);
  private readonly messageService = inject(MessageService);
  private readonly assignmentService = inject(ConversationAssignmentService);
  private readonly router = inject(Router);

  readonly conversationsPath = ROUTE_PATHS.CONVERSATIONS;

  readonly searchTerm = signal('');
  readonly activeFilter = signal<ConversationQuickFilter>('all');

  private readonly conversations = this.conversationService.conversations;
  readonly hasConversations = computed(() => this.conversations().length > 0);

  private readonly listItems = computed<ConversationListItem[]>(() =>
    this.conversations().map((conversation) => {
      const patientName = this.conversationService.getPatientName(conversation.patientId);
      const lastMessage = this.messageService.getLastMessage(conversation.id);

      return {
        conversation,
        patientName,
        patientInitials: getInitials(patientName),
        assignedToName: this.assignmentService.getAssignedUserName(conversation.assignedToUserId),
        lastMessagePreview: lastMessage?.body ?? '',
        lastMessageAt: lastMessage?.sentAt ?? null,
        unreadCount: this.messageService.getUnreadCount(conversation.id),
      };
    }),
  );

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.listItems()
      .filter((item) => {
        switch (filter) {
          case 'assigned':
            return item.conversation.assignedToUserId !== null;
          case 'open':
          case 'ai_pending':
          case 'closed':
            return item.conversation.status === filter;
          default:
            return true;
        }
      })
      .filter((item) => {
        if (!term) {
          return true;
        }
        return (
          item.patientName.toLowerCase().includes(term) ||
          item.lastMessagePreview.toLowerCase().includes(term) ||
          item.conversation.tags.some((tag) => tag.includes(term))
        );
      })
      .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onFilterChange(filter: ConversationQuickFilter): void {
    this.activeFilter.set(filter);
  }

  openConversation(item: ConversationListItem): void {
    this.router.navigate([this.conversationsPath, item.conversation.id]);
  }
}

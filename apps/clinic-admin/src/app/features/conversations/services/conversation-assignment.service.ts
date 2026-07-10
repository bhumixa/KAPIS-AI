import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, filter, forkJoin, map, switchMap, take, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ConversationAssignment,
  ConversationAssignmentInput,
} from '../models/conversation-assignment.model';
import { Conversation } from '../models/conversation.model';
import { ConversationService } from './conversation.service';
import { UserService } from '../../settings/services/user.service';

/**
 * Sprint 16 replaces the Sprint 9 mock assignment array with the real
 * append-only history apps/api-server's ConversationsModule now persists in
 * clinic.conversation_assignments. There is no dedicated "assign" endpoint -
 * `PATCH .../conversations/:id` accepts `assignedToUserId`/`assignedToRole`/
 * `assignedByName` together and, server-side, both updates the conversation's
 * pointer and writes a history row in the same request (see
 * apps/api-server's ConversationService.update()) - so `assign()` here is one
 * HTTP round trip, not two, avoiding the exact "two independently-delayed
 * Observables" bug the Sprint 9 mock's doc comment describes.
 * `getAssignedUserName` still reads Settings' (still mock) `UserService` -
 * Settings/Users has no backend module yet, only Conversations does.
 */
@Injectable({ providedIn: 'root' })
export class ConversationAssignmentService {
  private readonly http = inject(HttpClient);
  private readonly conversationService = inject(ConversationService);
  private readonly userService = inject(UserService);
  private readonly baseUrl = `${environment.apiBaseUrl}/conversations`;

  private readonly _assignments = signal<ConversationAssignment[]>([]);

  readonly assignments = this._assignments.asReadonly();

  constructor() {
    // Same one-time warm-up shape as MessageService: neither Inbox nor
    // ConversationDetails calls an explicit "load this conversation's
    // assignment history" method, so this fans out once, as soon as
    // ConversationService.conversations first has any rows.
    toObservable(this.conversationService.conversations)
      .pipe(
        filter((conversations) => conversations.length > 0),
        take(1),
        switchMap((conversations) =>
          forkJoin(conversations.map((conversation) => this.warmAssignments(conversation.id))),
        ),
      )
      .subscribe();
  }

  getAssignmentHistory(conversationId: string): ConversationAssignment[] {
    return this._assignments()
      .filter((assignment) => assignment.conversationId === conversationId)
      .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
  }

  getAssignedUserName(userId: string | null): string | null {
    if (!userId) {
      return null;
    }
    const user = this.userService.users().find((u) => u.id === userId);
    return user ? user.name : 'Unknown User';
  }

  assign(input: ConversationAssignmentInput): Observable<ConversationAssignment> {
    return this.http
      .patch<Conversation>(`${this.baseUrl}/${input.conversationId}`, {
        assignedToUserId: input.assignedToUserId,
        assignedToRole: input.assignedToRole,
        assignedByName: input.assignedByName,
      })
      .pipe(
        tap((conversation) =>
          this.conversationService.setAssignedUser(conversation.id, conversation.assignedToUserId),
        ),
        switchMap((conversation) => this.warmAssignments(conversation.id)),
        map((history) => history[0]),
      );
  }

  unassign(conversationId: string): Observable<void> {
    return this.http
      .patch<Conversation>(`${this.baseUrl}/${conversationId}`, { assignedToUserId: null })
      .pipe(
        map((conversation) => {
          this.conversationService.setAssignedUser(conversation.id, conversation.assignedToUserId);
        }),
      );
  }

  private warmAssignments(conversationId: string): Observable<ConversationAssignment[]> {
    return this.http
      .get<ConversationAssignment[]>(`${this.baseUrl}/${conversationId}/assignments`)
      .pipe(
        tap((history) => {
          this._assignments.update((existing) => [
            ...existing.filter((assignment) => assignment.conversationId !== conversationId),
            ...history,
          ]);
        }),
      );
  }
}

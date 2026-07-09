import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import {
  ConversationAssignment,
  ConversationAssignmentInput,
} from '../models/conversation-assignment.model';
import { ConversationService } from './conversation.service';
import { UserService } from '../../settings/services/user.service';

function createMockAssignments(): ConversationAssignment[] {
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'asg-1',
      conversationId: 'conv-1',
      assignedToUserId: 'user-2',
      assignedToRole: 'receptionist',
      assignedByName: 'Admin User',
      assignedAt: daysAgo(1),
    },
    {
      id: 'asg-2',
      conversationId: 'conv-3',
      assignedToUserId: 'user-3',
      assignedToRole: 'doctor',
      assignedByName: 'Fatima Rizvi',
      assignedAt: daysAgo(2),
    },
    {
      id: 'asg-3',
      conversationId: 'conv-4',
      assignedToUserId: 'user-2',
      assignedToRole: 'receptionist',
      assignedByName: 'Admin User',
      assignedAt: daysAgo(4),
    },
  ];
}

/**
 * Append-only assignment history, separate from `ConversationService` because
 * "who handled this and when" needs to survive reassignment - a mutable
 * `assignedToUserId` alone (which `Conversation` still carries, for cheap
 * list-view reads) can't answer "who else touched this conversation before".
 * `assign()` writes a history row here, then calls back into
 * `ConversationService.setAssignedUser()` so both stay in sync from a single
 * call site, the same "one call handles both cases" reasoning
 * `KnowledgeBaseService.saveDoctorProfileExtension()` uses for its upsert.
 */
@Injectable({ providedIn: 'root' })
export class ConversationAssignmentService {
  private readonly conversationService = inject(ConversationService);
  private readonly userService = inject(UserService);

  private readonly _assignments = signal<ConversationAssignment[]>(createMockAssignments());

  readonly assignments = this._assignments.asReadonly();

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
    const record: ConversationAssignment = {
      ...input,
      id: crypto.randomUUID(),
      assignedAt: new Date().toISOString(),
    };

    return of(record).pipe(
      delay(300),
      tap((created) => {
        this._assignments.update((assignments) => [...assignments, created]);
        this.conversationService.setAssignedUser(created.conversationId, created.assignedToUserId);
      }),
    );
  }

  unassign(conversationId: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this.conversationService.setAssignedUser(conversationId, null)),
    );
  }
}

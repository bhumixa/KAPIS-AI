import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { Conversation, ConversationInput, ConversationStatus } from '../models/conversation.model';
import { ConversationNote, ConversationNoteInput } from '../models/conversation-note.model';
import { PatientService } from '../../patients/services/patient.service';

function createMockConversations(): Conversation[] {
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'conv-1',
      patientId: 'pat-1',
      channel: 'whatsapp',
      status: 'open',
      assignedToUserId: 'user-2',
      tags: ['billing'],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(0),
    },
    {
      id: 'conv-2',
      patientId: 'pat-2',
      channel: 'whatsapp',
      status: 'ai_pending',
      assignedToUserId: null,
      tags: ['appointment'],
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: 'conv-3',
      patientId: 'pat-3',
      channel: 'whatsapp',
      status: 'waiting',
      assignedToUserId: 'user-3',
      tags: ['follow-up', 'diabetes'],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(0),
    },
    {
      id: 'conv-4',
      patientId: 'pat-4',
      channel: 'whatsapp',
      status: 'closed',
      assignedToUserId: 'user-2',
      tags: ['resolved'],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(3),
    },
    {
      id: 'conv-5',
      patientId: 'pat-6',
      channel: 'whatsapp',
      status: 'open',
      assignedToUserId: null,
      tags: ['prenatal'],
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: 'conv-6',
      patientId: 'pat-8',
      channel: 'whatsapp',
      status: 'ai_pending',
      assignedToUserId: null,
      tags: ['allergy'],
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
  ];
}

function createMockNotes(): ConversationNote[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'note-1',
      conversationId: 'conv-1',
      authorName: 'Fatima Rizvi',
      body: 'Checked billing system - duplicate charge confirmed, refund requested from accounts.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-2',
      conversationId: 'conv-3',
      authorName: 'Dr. Aisha Khan',
      body: 'Patient may need a medication review if readings stay above 160 for 3+ days.',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Owns conversations, their status/tags, and internal notes - one service
 * rather than three, mirroring `KnowledgeBaseService`'s reasoning: notes and
 * tags have no independent lifecycle from the conversation they belong to,
 * so splitting them out would just mean two services always read together.
 * Assignment gets its own `ConversationAssignmentService` instead, because
 * unlike notes/tags it needs append-only history (see that service's
 * doc-comment) and the brief calls it out as a separate concern.
 */
@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly patientService = inject(PatientService);

  private readonly _conversations = signal<Conversation[]>(createMockConversations());
  private readonly _notes = signal<ConversationNote[]>(createMockNotes());

  readonly conversations = this._conversations.asReadonly();
  readonly notes = this._notes.asReadonly();

  readonly conversationCount = computed(() => this._conversations().length);
  readonly activeConversationCount = computed(
    () => this._conversations().filter((conversation) => conversation.status !== 'closed').length,
  );
  readonly aiPendingCount = computed(
    () =>
      this._conversations().filter((conversation) => conversation.status === 'ai_pending').length,
  );

  getPatientName(patientId: string): string {
    const patient = this.patientService.patients().find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getNotesForConversation(conversationId: string): ConversationNote[] {
    return this._notes()
      .filter((note) => note.conversationId === conversationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ---- Conversations ----

  getConversations(): Observable<Conversation[]> {
    return of(this._conversations()).pipe(delay(300));
  }

  getConversation(id: string): Observable<Conversation | undefined> {
    return of(this._conversations().find((conversation) => conversation.id === id)).pipe(
      delay(300),
    );
  }

  createConversation(input: ConversationInput): Observable<Conversation> {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      ...input,
      id: crypto.randomUUID(),
      status: 'open',
      assignedToUserId: null,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    return of(conversation).pipe(
      delay(300),
      tap((created) => this._conversations.update((conversations) => [...conversations, created])),
    );
  }

  updateStatus(id: string, status: ConversationStatus): Observable<Conversation> {
    const existing = this._conversations().find((conversation) => conversation.id === id);
    if (!existing) {
      return throwError(() => new Error(`Conversation "${id}" was not found.`));
    }

    const updated: Conversation = { ...existing, status, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((conversation) =>
        this._conversations.update((conversations) =>
          conversations.map((c) => (c.id === id ? conversation : c)),
        ),
      ),
    );
  }

  /**
   * Synchronous mutator, not Observable-returning like the rest of this
   * service - `ConversationAssignmentService.assign()`/`unassign()` call it
   * from inside their own single `delay(300)` tap, so the assignment record
   * and this denormalized pointer land in the same tick. An earlier version
   * returned an Observable here and the assignment service `.subscribe()`d
   * to it from within its own tap, which composed two independently-delayed
   * Observables and made the UI lag the "assigned" confirmation by up to
   * 2x the intended delay.
   */
  setAssignedUser(id: string, assignedToUserId: string | null): void {
    this._conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === id
          ? { ...conversation, assignedToUserId, updatedAt: new Date().toISOString() }
          : conversation,
      ),
    );
  }

  addTag(id: string, tag: string): Observable<Conversation> {
    const existing = this._conversations().find((conversation) => conversation.id === id);
    if (!existing) {
      return throwError(() => new Error(`Conversation "${id}" was not found.`));
    }

    const normalized = tag.trim().toLowerCase();
    if (!normalized || existing.tags.includes(normalized)) {
      return of(existing).pipe(delay(150));
    }

    const updated: Conversation = {
      ...existing,
      tags: [...existing.tags, normalized],
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(150),
      tap((conversation) =>
        this._conversations.update((conversations) =>
          conversations.map((c) => (c.id === id ? conversation : c)),
        ),
      ),
    );
  }

  removeTag(id: string, tag: string): Observable<Conversation> {
    const existing = this._conversations().find((conversation) => conversation.id === id);
    if (!existing) {
      return throwError(() => new Error(`Conversation "${id}" was not found.`));
    }

    const updated: Conversation = {
      ...existing,
      tags: existing.tags.filter((t) => t !== tag),
      updatedAt: new Date().toISOString(),
    };

    return of(updated).pipe(
      delay(150),
      tap((conversation) =>
        this._conversations.update((conversations) =>
          conversations.map((c) => (c.id === id ? conversation : c)),
        ),
      ),
    );
  }

  // ---- Internal Notes ----

  addNote(input: ConversationNoteInput): Observable<ConversationNote> {
    const now = new Date().toISOString();
    const note: ConversationNote = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return of(note).pipe(
      delay(300),
      tap((created) => this._notes.update((notes) => [...notes, created])),
    );
  }

  updateNote(id: string, body: string): Observable<ConversationNote> {
    const existing = this._notes().find((note) => note.id === id);
    if (!existing) {
      return throwError(() => new Error(`Note "${id}" was not found.`));
    }

    const updated: ConversationNote = { ...existing, body, updatedAt: new Date().toISOString() };

    return of(updated).pipe(
      delay(300),
      tap((note) => this._notes.update((notes) => notes.map((n) => (n.id === id ? note : n)))),
    );
  }

  deleteNote(id: string): Observable<void> {
    return of(undefined).pipe(
      delay(300),
      tap(() => this._notes.update((notes) => notes.filter((note) => note.id !== id))),
    );
  }
}

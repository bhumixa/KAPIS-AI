import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PatientService } from '../../patients/services/patient.service';
import { Conversation, ConversationInput, ConversationStatus } from '../models/conversation.model';
import { ConversationNote, ConversationNoteInput } from '../models/conversation-note.model';

/**
 * Sprint 16 replaces the Sprint 9 mock data with the real Conversations API
 * (apps/api-server's ConversationsModule, mounted at `${apiBaseUrl}/conversations`) -
 * same signal-plus-Observable shape and the same swap DoctorService/
 * PatientService made in Sprint 12/13: only this file's method bodies moved
 * from `of(...)` to `HttpClient` calls, so every consumer (Inbox,
 * ConversationDetails, the dashboard) keeps working unchanged.
 *
 * Notes have no independent lifecycle from the conversation they belong to
 * (same reasoning as the Sprint 9 mock - see docs/Architecture.md), so this
 * service still owns both clinic.conversations and clinic.conversation_notes.
 * Since neither Inbox nor ConversationDetails ever calls an explicit "load
 * this conversation's notes" method (the mock's `_notes` signal was simply
 * pre-populated for every conversation up front), `getConversations()` warms
 * `_notes` for every conversation the same way, immediately after the list
 * loads - the same eager-load-everything shape DoctorService/PatientService
 * already use for their own single list, just fanned out over N conversations.
 */
@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly patientService = inject(PatientService);
  private readonly baseUrl = `${environment.apiBaseUrl}/conversations`;

  private readonly _conversations = signal<Conversation[]>([]);
  private readonly _notes = signal<ConversationNote[]>([]);

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

  constructor() {
    this.getConversations().subscribe();
  }

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
    return this.http.get<Conversation[]>(this.baseUrl).pipe(
      tap((conversations) => {
        this._conversations.set(conversations);
        conversations.forEach((conversation) => this.warmNotes(conversation.id));
      }),
    );
  }

  getConversation(id: string): Observable<Conversation | undefined> {
    return this.http
      .get<Conversation>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }

  createConversation(input: ConversationInput): Observable<Conversation> {
    return this.http
      .post<Conversation>(this.baseUrl, input)
      .pipe(
        tap((created) => this._conversations.update((conversations) => [created, ...conversations])),
      );
  }

  updateStatus(id: string, status: ConversationStatus): Observable<Conversation> {
    return this.patchConversation(id, { status });
  }

  /**
   * Synchronous mutator, not Observable-returning - `ConversationAssignmentService`
   * calls this after its own PATCH `.../conversations/:id` call already
   * succeeded, to keep this denormalized pointer in sync with the response it
   * just received, the same "one HTTP round trip, two local updates" shape
   * the Sprint 9 mock used (see that service's doc comment for the bug a
   * two-round-trip version caused there).
   */
  setAssignedUser(id: string, assignedToUserId: string | null): void {
    this._conversations.update((conversations) =>
      conversations.map((conversation) =>
        conversation.id === id ? { ...conversation, assignedToUserId } : conversation,
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
      return of(existing);
    }

    return this.patchConversation(id, { tags: [...existing.tags, normalized] });
  }

  removeTag(id: string, tag: string): Observable<Conversation> {
    const existing = this._conversations().find((conversation) => conversation.id === id);
    if (!existing) {
      return throwError(() => new Error(`Conversation "${id}" was not found.`));
    }

    return this.patchConversation(
      id,
      { tags: existing.tags.filter((t) => t !== tag) },
    );
  }

  private patchConversation(id: string, body: Record<string, unknown>): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.baseUrl}/${id}`, body).pipe(
      tap((conversation) =>
        this._conversations.update((conversations) =>
          conversations.map((c) => (c.id === id ? conversation : c)),
        ),
      ),
    );
  }

  // ---- Internal Notes ----

  addNote(input: ConversationNoteInput): Observable<ConversationNote> {
    return this.http
      .post<ConversationNote>(`${this.baseUrl}/${input.conversationId}/notes`, {
        authorName: input.authorName,
        body: input.body,
      })
      .pipe(tap((created) => this._notes.update((notes) => [created, ...notes])));
  }

  updateNote(id: string, body: string): Observable<ConversationNote> {
    const existing = this._notes().find((note) => note.id === id);
    if (!existing) {
      return throwError(() => new Error(`Note "${id}" was not found.`));
    }

    return this.http
      .patch<ConversationNote>(`${this.baseUrl}/${existing.conversationId}/notes/${id}`, { body })
      .pipe(
        tap((note) => this._notes.update((notes) => notes.map((n) => (n.id === id ? note : n)))),
      );
  }

  deleteNote(id: string): Observable<void> {
    const existing = this._notes().find((note) => note.id === id);
    if (!existing) {
      return throwError(() => new Error(`Note "${id}" was not found.`));
    }

    return this.http
      .delete<void>(`${this.baseUrl}/${existing.conversationId}/notes/${id}`)
      .pipe(tap(() => this._notes.update((notes) => notes.filter((note) => note.id !== id))));
  }

  private warmNotes(conversationId: string): void {
    this.http
      .get<ConversationNote[]>(`${this.baseUrl}/${conversationId}/notes`)
      .subscribe((notes) => {
        this._notes.update((existing) => [
          ...existing.filter((note) => note.conversationId !== conversationId),
          ...notes,
        ]);
      });
  }
}

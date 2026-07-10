import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, filter, forkJoin, map, switchMap, take, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConversationService } from './conversation.service';
import { Message, MessageInput } from '../models/message.model';

interface PaginatedMessages {
  items: Message[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Sprint 16 replaces the Sprint 9 mock message array with the real
 * `GET/POST .../conversations/:id/messages` endpoints. `getMessagesForConversation`/
 * `getUnreadCount`/`getLastMessage`/`totalUnreadCount` are still plain sync
 * reads over one flat `_messages` signal (unchanged public shape) - since
 * neither Inbox nor ConversationDetails calls an explicit per-conversation
 * "load messages" method (the mock array simply held every conversation's
 * messages from the start), this service warms `_messages` for every
 * conversation itself, once, as soon as `ConversationService.conversations`
 * first has any rows - `toObservable` + `take(1)` turns that one-time warm-up
 * into a plain Observable without this service needing an `effect()`.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly conversationService = inject(ConversationService);
  private readonly baseUrl = `${environment.apiBaseUrl}/conversations`;

  private readonly _messages = signal<Message[]>([]);

  readonly messages = this._messages.asReadonly();

  readonly totalUnreadCount = computed(
    () =>
      this._messages().filter((message) => message.direction === 'incoming' && !message.read)
        .length,
  );

  constructor() {
    toObservable(this.conversationService.conversations)
      .pipe(
        filter((conversations) => conversations.length > 0),
        take(1),
        switchMap((conversations) =>
          forkJoin(conversations.map((conversation) => this.getMessages(conversation.id))),
        ),
      )
      .subscribe();
  }

  getMessagesForConversation(conversationId: string): Message[] {
    return this._messages()
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }

  getUnreadCount(conversationId: string): number {
    return this._messages().filter(
      (message) =>
        message.conversationId === conversationId &&
        message.direction === 'incoming' &&
        !message.read,
    ).length;
  }

  getLastMessage(conversationId: string): Message | undefined {
    const messages = this.getMessagesForConversation(conversationId);
    return messages[messages.length - 1];
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http
      .get<PaginatedMessages>(`${this.baseUrl}/${conversationId}/messages`, {
        params: { pageSize: 200 },
      })
      .pipe(
        map((response) => response.items),
        tap((messages) => {
          this._messages.update((existing) => [
            ...existing.filter((message) => message.conversationId !== conversationId),
            ...messages,
          ]);
        }),
      );
  }

  sendMessage(input: MessageInput): Observable<Message> {
    return this.http
      .post<Message>(`${this.baseUrl}/${input.conversationId}/messages`, {
        direction: input.direction,
        sender: input.sender,
        senderName: input.senderName,
        body: input.body,
      })
      .pipe(tap((created) => this._messages.update((messages) => [...messages, created])));
  }

  /** Marks every unread incoming message in a conversation as read - called when the Conversation Details page opens it. */
  markConversationRead(conversationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${conversationId}/read`, {}).pipe(
      tap(() =>
        this._messages.update((messages) =>
          messages.map((message) =>
            message.conversationId === conversationId &&
            message.direction === 'incoming' &&
            !message.read
              ? { ...message, read: true }
              : message,
          ),
        ),
      ),
    );
  }
}

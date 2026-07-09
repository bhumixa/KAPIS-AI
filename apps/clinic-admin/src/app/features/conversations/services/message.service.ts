import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { Message, MessageInput } from '../models/message.model';

function createMockMessages(): Message[] {
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  return [
    // conv-1 - Meera Shah, open, assigned to Fatima Rizvi (receptionist)
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Meera Shah',
      body: 'Hi, I was charged twice for my last consultation. Can someone check this?',
      sentAt: hoursAgo(5),
      read: true,
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      direction: 'outgoing',
      sender: 'staff',
      senderName: 'Fatima Rizvi',
      body: "Hi Meera, sorry about that - I'm pulling up your billing history now.",
      sentAt: hoursAgo(4),
      read: true,
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Meera Shah',
      body: 'Thank you! Also, can I get a copy of the receipt for insurance?',
      sentAt: hoursAgo(1),
      read: false,
    },

    // conv-2 - Aarav Patel (parent), AI Pending, unassigned
    {
      id: 'msg-4',
      conversationId: 'conv-2',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Aarav Patel',
      body: "What time is Aarav's checkup tomorrow?",
      sentAt: hoursAgo(2),
      read: false,
    },
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Aarav Patel',
      body: 'Also, does he need to fast before it?',
      sentAt: hoursAgo(2),
      read: false,
    },

    // conv-3 - Ibrahim Sheikh, waiting, assigned to Dr. Aisha Khan
    {
      id: 'msg-6',
      conversationId: 'conv-3',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Ibrahim Sheikh',
      body: 'My blood sugar readings have been higher than usual this week.',
      sentAt: hoursAgo(20),
      read: true,
    },
    {
      id: 'msg-7',
      conversationId: 'conv-3',
      direction: 'outgoing',
      sender: 'staff',
      senderName: 'Dr. Aisha Khan',
      body: 'Please share your readings for the last 5 days and avoid sugary snacks meanwhile.',
      sentAt: hoursAgo(19),
      read: true,
    },
    {
      id: 'msg-8',
      conversationId: 'conv-3',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Ibrahim Sheikh',
      body: "Sharing them now, they're all above 160 fasting.",
      sentAt: hoursAgo(3),
      read: false,
    },

    // conv-4 - Kavya Reddy, closed, assigned to Fatima Rizvi
    {
      id: 'msg-9',
      conversationId: 'conv-4',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Kavya Reddy',
      body: 'Can I reschedule my appointment to next week?',
      sentAt: hoursAgo(72),
      read: true,
    },
    {
      id: 'msg-10',
      conversationId: 'conv-4',
      direction: 'outgoing',
      sender: 'staff',
      senderName: 'Fatima Rizvi',
      body: "Done - you're moved to next Tuesday at 10:00 AM. See you then!",
      sentAt: hoursAgo(70),
      read: true,
    },

    // conv-5 - Sneha Kulkarni, open, unassigned
    {
      id: 'msg-11',
      conversationId: 'conv-5',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Sneha Kulkarni',
      body: 'Is it normal to feel this tired in the second trimester?',
      sentAt: hoursAgo(6),
      read: false,
    },

    // conv-6 - Ananya Iyer, AI Pending, unassigned
    {
      id: 'msg-12',
      conversationId: 'conv-6',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Ananya Iyer',
      body: 'What foods should I avoid with a nut allergy before the follow-up?',
      sentAt: hoursAgo(8),
      read: true,
    },
    {
      id: 'msg-13',
      conversationId: 'conv-6',
      direction: 'outgoing',
      sender: 'ai',
      senderName: 'Kapis AI',
      body: 'Great question! Avoid peanuts, tree nuts, and anything processed in shared facilities. A staff member will follow up shortly.',
      sentAt: hoursAgo(8),
      read: true,
    },
    {
      id: 'msg-14',
      conversationId: 'conv-6',
      direction: 'incoming',
      sender: 'patient',
      senderName: 'Ananya Iyer',
      body: 'Got it, thank you!',
      sentAt: hoursAgo(7),
      read: false,
    },
  ];
}

/**
 * Sprint 9 has no backend, so all messages live in one flat `_messages`
 * signal keyed by `conversationId` - same signal-plus-Observable split as
 * every other feature service. Read helpers (`getMessagesForConversation`,
 * `getUnreadCount`, `getLastMessage`) are plain sync methods called from
 * inside a `computed()` in the consuming page, the same idiom
 * `AppointmentService.getPatientName()` established, rather than a mat-table
 * data source - a chat timeline needs neither sorting nor pagination.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly _messages = signal<Message[]>(createMockMessages());

  readonly messages = this._messages.asReadonly();

  readonly totalUnreadCount = computed(
    () =>
      this._messages().filter((message) => message.direction === 'incoming' && !message.read)
        .length,
  );

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
    return of(this.getMessagesForConversation(conversationId)).pipe(delay(300));
  }

  sendMessage(input: MessageInput): Observable<Message> {
    const message: Message = {
      ...input,
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      read: input.direction === 'incoming',
    };

    return of(message).pipe(
      delay(300),
      tap((created) => this._messages.update((messages) => [...messages, created])),
    );
  }

  /** Marks every unread incoming message in a conversation as read - called when the Conversation Details page opens it. */
  markConversationRead(conversationId: string): Observable<void> {
    return of(undefined).pipe(
      delay(150),
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

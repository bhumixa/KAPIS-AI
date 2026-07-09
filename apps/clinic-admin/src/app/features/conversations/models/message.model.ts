export type MessageDirection = 'incoming' | 'outgoing';

export type MessageSender = 'patient' | 'staff' | 'ai';

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  sender: MessageSender;
  senderName: string;
  body: string;
  sentAt: string;
  /** Only meaningful for `direction: 'incoming'` - outgoing messages are always "read" by definition. */
  read: boolean;
}

/** Create payload - the mock service owns id, sentAt, and read (defaulted per direction) rather than the caller supplying them. */
export type MessageInput = Omit<Message, 'id' | 'sentAt' | 'read'>;

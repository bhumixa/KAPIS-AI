export interface ConversationNote {
  id: string;
  conversationId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

/** Create/update payload - the mock service owns id and timestamps. */
export type ConversationNoteInput = Pick<
  ConversationNote,
  'conversationId' | 'authorName' | 'body'
>;

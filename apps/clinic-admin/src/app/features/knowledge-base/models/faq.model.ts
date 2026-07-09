export type FaqStatus = 'published' | 'draft';

/** A single question/answer pair the future AI receptionist can draw on when answering patients. */
export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: FaqStatus;
  createdAt: string;
  updatedAt: string;
}

export type FaqInput = Omit<Faq, 'id' | 'createdAt' | 'updatedAt'>;

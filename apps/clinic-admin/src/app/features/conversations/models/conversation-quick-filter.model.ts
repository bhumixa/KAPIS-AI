/**
 * Inbox quick-filter vocabulary - deliberately not the same union as
 * `ConversationStatus`. 'assigned' filters on `assignedToUserId !== null`
 * (a cross-status condition, per the Sprint 9 brief's Filters list), while
 * 'open' / 'ai_pending' / 'closed' filter on the matching `ConversationStatus`
 * value. 'waiting' has no quick-filter chip - it's still visible under 'all'.
 */
export type ConversationQuickFilter = 'all' | 'open' | 'assigned' | 'ai_pending' | 'closed';

export const CONVERSATION_QUICK_FILTERS: readonly ConversationQuickFilter[] = [
  'all',
  'open',
  'assigned',
  'ai_pending',
  'closed',
];

export const CONVERSATION_QUICK_FILTER_LABELS: Record<ConversationQuickFilter, string> = {
  all: 'All',
  open: 'Open',
  assigned: 'Assigned',
  ai_pending: 'AI Pending',
  closed: 'Closed',
};

import { UserRole } from '../../../core/models/user.model';

/**
 * Reuses `UserRole` from `core/models/user.model.ts` rather than redefining it,
 * same idiom `settings/models/clinic-user.model.ts` uses - a conversation can
 * only be assigned to the same role vocabulary a `ClinicUser` already has.
 */
export type { UserRole };

/** Conversations are assigned to front-of-house staff, never to 'admin'. */
export const ASSIGNABLE_ROLES: readonly UserRole[] = ['receptionist', 'doctor'];

/** One row per assignment made - an append-only history, not a mutable pointer, so "who handled this conversation and when" survives reassignment. */
export interface ConversationAssignment {
  id: string;
  conversationId: string;
  assignedToUserId: string;
  assignedToRole: UserRole;
  assignedByName: string;
  assignedAt: string;
}

export type ConversationAssignmentInput = Pick<
  ConversationAssignment,
  'conversationId' | 'assignedToUserId' | 'assignedToRole' | 'assignedByName'
>;

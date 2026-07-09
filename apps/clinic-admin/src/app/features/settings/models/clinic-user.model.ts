import { UserRole } from '../../../core/models/user.model';

/**
 * Reuses `UserRole` from `core/models/user.model.ts` instead of redefining
 * the same three-value union - `core.User` is the dummy auth session shape
 * (Sprint 1) and this `ClinicUser` is the managed-user record User Management
 * CRUDs; they share a role vocabulary because they're the same real-world
 * concept, so the day a real JWT backend arrives, logging in as one of these
 * users is a natural fit rather than a coincidence of naming.
 */
export type { UserRole };

export const USER_ROLES: readonly UserRole[] = ['admin', 'receptionist', 'doctor'];

export type ClinicUserStatus = 'active' | 'inactive';

export interface ClinicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: ClinicUserStatus;
  createdAt: string;
  updatedAt: string;
}

export type ClinicUserInput = Omit<ClinicUser, 'id' | 'createdAt' | 'updatedAt'>;

import { UserRole } from './user.model';

export interface NavItem {
  label: string;
  icon: string;
  /** Required for a leaf item; omitted on a parent that only groups `children`. */
  route?: string;
  /** When true, the router only marks this item active on an exact URL match. */
  exactMatch?: boolean;
  /** Omitted means visible to every role; otherwise only shown to the roles listed. */
  roles?: UserRole[];
  children?: NavItem[];
}

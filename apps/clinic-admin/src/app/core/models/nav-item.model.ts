export interface NavItem {
  label: string;
  icon: string;
  /** Required for a leaf item; omitted on a parent that only groups `children`. */
  route?: string;
  /** When true, the router only marks this item active on an exact URL match. */
  exactMatch?: boolean;
  children?: NavItem[];
}

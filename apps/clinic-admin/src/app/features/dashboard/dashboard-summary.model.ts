export interface SummaryCard {
  label: string;
  value: number;
  icon: string;
  /** CSS custom property to color the icon chip, e.g. 'var(--mat-sys-primary)'. */
  accentVar: string;
}

export interface QuickAction {
  label: string;
  icon: string;
}

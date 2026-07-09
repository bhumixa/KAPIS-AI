export type PolicyType =
  'cancellation' | 'refund' | 'privacy' | 'appointment' | 'payment' | 'insurance';

export const POLICY_TYPES: PolicyType[] = [
  'cancellation',
  'refund',
  'privacy',
  'appointment',
  'payment',
  'insurance',
];

export type PolicyStatus = 'active' | 'inactive';

/** A clinic policy document the AI/WhatsApp modules can quote verbatim when a patient asks about it. */
export interface Policy {
  id: string;
  title: string;
  type: PolicyType;
  content: string;
  status: PolicyStatus;
  createdAt: string;
  updatedAt: string;
}

export type PolicyInput = Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>;

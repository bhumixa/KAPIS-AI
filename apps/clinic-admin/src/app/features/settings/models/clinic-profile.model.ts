/**
 * A small curated list, not exhaustive IANA tz data - enough for a single-clinic
 * deployment today; swap for a real tz database once multi-region clinics exist.
 */
export const TIME_ZONES: readonly string[] = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

export const CURRENCIES: readonly string[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export const LANGUAGES: readonly string[] = ['English', 'Hindi', 'Arabic', 'Spanish', 'French'];

export interface ClinicProfile {
  id: string;
  clinicName: string;
  /** Placeholder only - Sprint 6 has no file upload, this stores a URL/emoji stand-in. */
  logoUrl: string;
  registrationNumber: string;
  /** Optional - not every clinic has a tax id at setup time. */
  taxId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  timeZone: string;
  currency: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export type ClinicProfileInput = Omit<ClinicProfile, 'id' | 'createdAt' | 'updatedAt'>;

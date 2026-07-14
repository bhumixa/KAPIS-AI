export type InquiryStatus = 'open' | 'converted' | 'closed';

/** Mirrors apps/api-server's InquiryDto - a lead: a first-time WhatsApp sender with no matching patient record yet (Sprint 25). */
export interface Inquiry {
  id: string;
  whatsappNumber: string;
  displayName: string;
  status: InquiryStatus;
  convertedPatientId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

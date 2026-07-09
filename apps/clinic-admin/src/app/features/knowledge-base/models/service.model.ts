export type ClinicServiceStatus = 'active' | 'inactive';

/** A billable service the clinic offers (e.g. "General Consultation") - future AI/WhatsApp modules quote these to patients. */
export interface ClinicService {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  status: ClinicServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export type ClinicServiceInput = Omit<ClinicService, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * AI/patient-facing content about a doctor, on top of the operational record
 * already owned by `DoctorService` (name, specialization, fee, ...). Kept as
 * its own one-row-per-doctor entity rather than adding these fields onto
 * `Doctor` itself, so the doctors feature stays free of knowledge-base
 * concerns and this feature never duplicates doctor identity data - it only
 * ever stores a `doctorId` foreign key plus the fields below.
 */
export interface DoctorProfileExtension {
  id: string;
  doctorId: string;
  biography: string;
  languages: string[];
  awards: string[];
  certifications: string[];
  publications: string[];
  interests: string[];
  videoUrl: string;
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
}

export type DoctorProfileExtensionInput = Omit<
  DoctorProfileExtension,
  'id' | 'createdAt' | 'updatedAt'
>;

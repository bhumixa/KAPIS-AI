export type Gender = 'male' | 'female' | 'other';

export type PatientStatus = 'active' | 'inactive';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export const BLOOD_GROUPS: readonly BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'unknown',
];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  bloodGroup: BloodGroup;
  address: string;
  emergencyContact: EmergencyContact;
  allergies: string;
  medicalNotes: string;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

/** Create/update payload - the server (today: the mock service) owns id and timestamps. */
export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

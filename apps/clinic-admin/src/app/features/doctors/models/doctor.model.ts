export type Gender = 'male' | 'female' | 'other';

export type DoctorStatus = 'active' | 'inactive';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  specialization: string;
  qualification: string;
  experienceYears: number;
  registrationNumber: string;
  phone: string;
  email: string;
  consultationFee: number;
  consultationDuration: number;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
}

/** Create/update payload - the server (today: the mock service) owns id and timestamps. */
export type DoctorInput = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>;

export type InsuranceProviderStatus = 'active' | 'inactive';

/** An insurance provider the clinic accepts - referenced when patients ask "do you take my insurance?". */
export interface InsuranceProvider {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  status: InsuranceProviderStatus;
  createdAt: string;
  updatedAt: string;
}

export type InsuranceProviderInput = Omit<InsuranceProvider, 'id' | 'createdAt' | 'updatedAt'>;

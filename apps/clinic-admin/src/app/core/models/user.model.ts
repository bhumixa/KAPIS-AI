export type UserRole = 'admin' | 'receptionist' | 'doctor' | 'developer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'receptionist' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

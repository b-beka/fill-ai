export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  org_id: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type UserRole = 'ROLE_DRIVER' | 'ROLE_MECHANIC' | 'DRIVER' | 'MECHANIC';

export interface AuthUser {
  id?: number;
  fullName?: string;
  email: string;
  role: string;
  token: string;
  phone?: string;
  defaultLicensePlate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  modelYear?: number;
  baseMileageKm?: number;
}


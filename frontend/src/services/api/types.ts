// API Response Types
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

// Auth Types - Based on Postman Collection
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  role: string; // "Artist", "Collector", "Gallery", etc.
  points?: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  region?: number; // Optional region
  referral_code?: string;
}

// Login Response - Structure may vary, adjust based on actual API response
export interface LoginResponse {
  token?: string;
  access?: string; // Some APIs use 'access' instead of 'token'
  refresh?: string;
  user?: User;
  message?: string | Record<string, unknown>;
  success?: boolean;
  status_code?: number;
  data?: User | Record<string, unknown>;
  // Handle different response structures
  [key: string]: unknown;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface User {
  id?: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string; // For backward compatibility
  lastName?: string; // For backward compatibility
  role?: string;
  points?: string | number;
  region?: number;
  persona?: string;
  avatar?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // For backward compatibility
  updatedAt?: string; // For backward compatibility
  [key: string]: unknown; // Allow additional fields from API
}

// Generic API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}


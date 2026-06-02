export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
  total_credits_used: number;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string | null;
  last_login_at: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

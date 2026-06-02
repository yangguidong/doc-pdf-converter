export interface User {
  id: number
  username: string
  email: string
  role: string
  avatar_url: string | null
  created_at: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

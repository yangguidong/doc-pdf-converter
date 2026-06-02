import apiClient from './client';
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '../types/user';

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await apiClient.post('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<TokenResponse> {
  const res = await apiClient.post('/auth/register', data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me');
  return res.data;
}

export async function updateMe(data: { username?: string; avatar_url?: string }): Promise<User> {
  const res = await apiClient.put('/auth/me', data);
  return res.data;
}

export async function changePassword(data: { old_password: string; new_password: string }): Promise<void> {
  await apiClient.put('/auth/password', data);
}

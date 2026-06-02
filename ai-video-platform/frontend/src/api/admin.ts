import apiClient from './client';
import type { User } from '../types/user';
import type { Video } from '../types/video';
import type { ModelConfig } from '../types/model';

export async function getDashboard(): Promise<any> {
  const res = await apiClient.get('/admin/dashboard');
  return res.data;
}

export async function listUsers(params: { page?: number; per_page?: number; search?: string; role?: string }): Promise<User[]> {
  const res = await apiClient.get('/admin/users', { params });
  return res.data;
}

export async function updateUser(userId: number, data: Record<string, any>): Promise<User> {
  const res = await apiClient.put(`/admin/users/${userId}`, data);
  return res.data;
}

export async function listAllVideos(params: { page?: number; per_page?: number; status?: string }): Promise<Video[]> {
  const res = await apiClient.get('/admin/videos', { params });
  return res.data;
}

export async function adminDeleteVideo(id: number): Promise<void> {
  await apiClient.delete(`/admin/videos/${id}`);
}

export async function getDailyStats(days?: number): Promise<any[]> {
  const res = await apiClient.get('/admin/stats/daily', { params: { days } });
  return res.data;
}

export async function getAdminModels(): Promise<ModelConfig[]> {
  const res = await apiClient.get('/admin/models');
  return res.data;
}

export async function updateModelConfig(modelId: number, data: Record<string, any>): Promise<ModelConfig> {
  const res = await apiClient.put(`/admin/models/${modelId}`, data);
  return res.data;
}

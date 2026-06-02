import apiClient from './client';
import type { ModelConfig } from '../types/model';

export async function getModels(): Promise<ModelConfig[]> {
  const res = await apiClient.get('/models');
  return res.data;
}

import apiClient from './client';
import type { Video, VideoGenerateRequest, VideoListResponse } from '../types/video';

export async function generateVideo(data: VideoGenerateRequest): Promise<Video> {
  const res = await apiClient.post('/videos/generate', data);
  return res.data;
}

export async function listVideos(params: {
  page?: number;
  per_page?: number;
  status?: string;
  generation_type?: string;
}): Promise<VideoListResponse> {
  const res = await apiClient.get('/videos', { params });
  return res.data;
}

export async function getVideo(id: number): Promise<Video> {
  const res = await apiClient.get(`/videos/${id}`);
  return res.data;
}

export async function getVideoStatus(id: number): Promise<{
  id: number;
  status: string;
  progress: number;
  error_message: string | null;
  output_video_path: string | null;
  output_thumbnail_path: string | null;
}> {
  const res = await apiClient.get(`/videos/${id}/status`);
  return res.data;
}

export async function deleteVideo(id: number): Promise<void> {
  await apiClient.delete(`/videos/${id}`);
}

export async function getPublicVideos(params: {
  page?: number;
  per_page?: number;
}): Promise<VideoListResponse> {
  const res = await apiClient.get('/videos/public', { params });
  return res.data;
}

export function getVideoDownloadUrl(id: number): string {
  return `/api/videos/${id}/download`;
}

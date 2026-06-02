export interface Video {
  id: number;
  user_id: number;
  title: string | null;
  description: string | null;
  prompt: string;
  model_name: string;
  generation_type: 'text_to_video' | 'image_to_video' | 'video_edit';
  source_image_path: string | null;
  source_video_path: string | null;
  output_video_path: string | null;
  output_thumbnail_path: string | null;
  duration_seconds: number | null;
  resolution: string | null;
  file_size_bytes: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message: string | null;
  credits_cost: number;
  is_public: boolean;
  created_at: string | null;
  completed_at: string | null;
}

export interface VideoGenerateRequest {
  model_key: string;
  generation_type: string;
  prompt: string;
  source_image_id?: number | null;
  source_video_id?: number | null;
  resolution?: string;
  duration?: number;
  is_public?: boolean;
  title?: string | null;
}

export interface VideoListResponse {
  items: Video[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

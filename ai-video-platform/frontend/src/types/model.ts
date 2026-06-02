export interface ModelConfig {
  id: number;
  model_key: string;
  display_name: string;
  provider: string;
  is_enabled: boolean;
  supported_types: string[];
  max_duration: number;
  supported_resolutions: string[];
  credits_per_generation: number;
  created_at: string | null;
}

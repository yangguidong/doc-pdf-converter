export type ModuleType = 'avoidance' | 'clicker' | 'match3' | 'quiz'

export interface GameParams {
  difficulty: 'easy' | 'normal' | 'hard'
  duration: number
  [key: string]: any
}

export interface GameSkin {
  id: number
  name: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  css_class: string
}

export interface Game {
  id: number
  user_id: number
  title: string
  description: string | null
  module_type: ModuleType
  params_json: string
  skin_id: number | null
  share_code: string
  is_published: boolean
  is_public: boolean
  thumbnail_url: string | null
  punishment_type: string
  punishment_config: string
  play_count: number
  created_at: string | null
  updated_at: string | null
}

export interface GameListItem {
  id: number
  user_id: number
  title: string
  description: string | null
  module_type: ModuleType
  share_code: string
  is_published: boolean
  is_public: boolean
  play_count: number
  created_at: string | null
}

export interface PlayRecord {
  id: number
  game_id: number
  player_name: string
  score: number
  result: 'win' | 'lose'
  duration_seconds: number
  played_at: string | null
}

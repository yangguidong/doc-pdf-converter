import { create } from 'zustand'
import type { ModuleType, GameSkin } from '../types/game'

interface EditorState {
  step: number
  moduleType: ModuleType | null
  title: string
  description: string
  params: Record<string, any>
  skinId: number | null
  skin: GameSkin | null
  punishmentType: string
  punishmentConfig: Record<string, any>
  gameId: number | null
  shareCode: string | null
  setStep: (step: number) => void
  setModuleType: (t: ModuleType) => void
  setTitle: (t: string) => void
  setDescription: (d: string) => void
  setParams: (p: Record<string, any>) => void
  setSkin: (s: GameSkin) => void
  setPunishmentType: (t: string) => void
  setPunishmentConfig: (c: Record<string, any>) => void
  setGameId: (id: number) => void
  setShareCode: (code: string) => void
  reset: () => void
  getCreatePayload: () => {
    title: string
    description: string
    module_type: string
    params_json: string
    skin_id: number | null
    punishment_type: string
    punishment_config: string
  }
}

const defaultParams: Record<string, Record<string, any>> = {
  avoidance: { difficulty: 'normal', duration: 30, playerSpeed: 3, spawnRate: 2, obstacleTypes: ['poop', 'water'] },
  clicker: { difficulty: 'normal', duration: 30, targetScore: 100, clickZones: 1, speedRamp: false },
  match3: { difficulty: 'normal', duration: 60, boardSize: 6, pieceTypes: 4 },
  quiz: { difficulty: 'normal', questionCount: 10, timePerQuestion: 10 },
}

export const useEditorStore = create<EditorState>((set, get) => ({
  step: 0,
  moduleType: null,
  title: '',
  description: '',
  params: {},
  skinId: null,
  skin: null,
  punishmentType: 'text',
  punishmentConfig: { message: '哈哈哈你被整了！' },
  gameId: null,
  shareCode: null,

  setStep: (step) => set({ step }),
  setModuleType: (t) => set({ moduleType: t, params: defaultParams[t] || {} }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setParams: (params) => set({ params }),
  setSkin: (skin) => set({ skin, skinId: skin.id }),
  setPunishmentType: (punishmentType) => set({ punishmentType }),
  setPunishmentConfig: (punishmentConfig) => set({ punishmentConfig }),
  setGameId: (gameId) => set({ gameId }),
  setShareCode: (shareCode) => set({ shareCode }),

  reset: () => set({
    step: 0, moduleType: null, title: '', description: '',
    params: {}, skinId: null, skin: null, punishmentType: 'text',
    punishmentConfig: { message: '哈哈哈你被整了！' }, gameId: null, shareCode: null,
  }),

  getCreatePayload: () => {
    const s = get()
    return {
      title: s.title || `我的整蛊游戏`,
      description: s.description || '',
      module_type: s.moduleType || 'avoidance',
      params_json: JSON.stringify(s.params),
      skin_id: s.skinId,
      punishment_type: s.punishmentType,
      punishment_config: JSON.stringify(s.punishmentConfig),
    }
  },
}))

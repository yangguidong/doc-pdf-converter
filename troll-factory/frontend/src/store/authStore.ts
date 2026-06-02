import { create } from 'zustand'
import type { User } from '../types/user'
import { getMe } from '../api/auth'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  fetchUser: () => Promise<void>
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  fetchUser: async () => {
    const token = localStorage.getItem('troll_token')
    if (!token) {
      set({ user: null, loading: false })
      return
    }
    try {
      const user = await getMe()
      set({ user, loading: false })
    } catch {
      localStorage.removeItem('troll_token')
      set({ user: null, loading: false })
    }
  },
  logout: () => {
    localStorage.removeItem('troll_token')
    set({ user: null })
  },
  isLoggedIn: () => !!get().user,
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  setUser:   (user: User) => void
  clearUser: () => void
}

/**
 * Stores the user profile in localStorage so the UI can render immediately
 * on page refresh (no flash of unauthenticated content).
 *
 * The access token is NEVER stored here — it lives only in memory (api.ts).
 * The refresh token is stored in an httpOnly cookie by the server.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser:   (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'exam-prep-user', // localStorage key
    },
  ),
)

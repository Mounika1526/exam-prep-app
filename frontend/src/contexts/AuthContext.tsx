import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { api, setAccessToken } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'


interface AuthContextValue {
  /** Authenticated user, or null when logged out. */
  user: User | null
  /** True while the initial session-restore is in flight. */
  isLoading: boolean
  /** Convenience flag — true when user.role === 'ADMIN'. */
  isAdmin: boolean
  /** Log in, store access token in memory, persist user in Zustand. Returns the user. */
  login: (email: string, password: string) => Promise<User>
  /** Log out, clear token + user, invalidate server-side refresh token. */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)


export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, setUser, clearUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  /**
   * On every page load:
   *   1. POST /auth/refresh (httpOnly cookie sent automatically by the browser)
   *   2. Store the new access token in memory
   *   3. GET /auth/me to get a fresh user object
   *
   * If either call fails (no valid cookie / revoked session), clear state.
   */
  const restoreSession = useCallback(async () => {
    try {
      const { data: refreshData } = await api.post('/auth/refresh', {})
      setAccessToken(refreshData.data.accessToken)

      const { data: meData } = await api.get('/auth/me')
      setUser(meData.data)
    } catch {
      setAccessToken(null)
      clearUser()
    } finally {
      setIsLoading(false)
    }
  }, [setUser, clearUser])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // ─── Auth actions ────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { email, password })
    setAccessToken(data.data.accessToken)
    setUser(data.data.user)
    return data.data.user as User
  }, [setUser])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Best-effort — always clear local state regardless
    } finally {
      setAccessToken(null)
      clearUser()
    }
  }, [clearUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

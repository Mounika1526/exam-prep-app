import axios, { type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── In-memory access token ────────────────────────────────────────────────────
// Never stored in localStorage or sessionStorage — lives only in JS memory.
// Cleared on page refresh (session is restored via the httpOnly refreshToken cookie).

let _accessToken: string | null = null

export const setAccessToken = (t: string | null) => { _accessToken = t }
export const getAccessToken = () => _accessToken

// ─── Axios instance ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  withCredentials: true, // sends the httpOnly refreshToken cookie automatically
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach access token ────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

// ─── Response interceptor — auto-refresh on 401 ───────────────────────────────
// When an API call returns 401 (expired access token):
//   1. Call /auth/refresh (httpOnly cookie is sent automatically)
//   2. Store the new access token in memory
//   3. Retry the original request with the new token
//
// Concurrent 401s are queued until the refresh completes,
// then all are retried at once.

let _isRefreshing = false
let _queue: Array<(token: string | null) => void> = []

function drainQueue(token: string | null) {
  _queue.forEach((resolve) => resolve(token))
  _queue = []
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryConfig

    const is401       = error.response?.status === 401
    const alreadyRetried = original?._retry
    const isRefreshCall  = original?.url?.includes('/auth/refresh')
    const isLoginCall    = original?.url?.includes('/auth/login')

    if (!is401 || alreadyRetried || isRefreshCall || isLoginCall) {
      return Promise.reject(error)
    }

    // Queue this request while a refresh is in-flight
    if (_isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        _queue.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          } else {
            reject(error)
          }
        })
      })
    }

    original._retry   = true
    _isRefreshing = true

    try {
      // Use a plain axios call so it doesn't re-trigger this interceptor
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      const newToken = data.data.accessToken
      setAccessToken(newToken)
      drainQueue(newToken)

      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      setAccessToken(null)
      drainQueue(null)

      // Dynamic import avoids a circular dependency
      const { useAuthStore } = await import('@/stores/authStore')
      useAuthStore.getState().clearUser()
      window.location.href = '/login'

      return Promise.reject(refreshError)
    } finally {
      _isRefreshing = false
    }
  },
)

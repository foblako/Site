import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  fetchMe,
  login as loginRequest,
  refresh as refreshRequest,
  register as registerRequest,
  setAuthAccessTokenProvider,
  setAuthRefreshHandler,
} from '../api'
import type { AuthUser, TokenPair } from '../types'
import { clearTokens, readTokens, writeTokens } from './tokenStorage'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<AuthUser>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

type Props = { children: ReactNode }

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Tokens live in a ref so the fetch client's callbacks (registered once)
  // always see the latest value without re-binding on every render.
  const tokensRef = useRef<TokenPair | null>(null)

  const applyTokens = useCallback((next: TokenPair | null) => {
    tokensRef.current = next
    if (next === null) {
      clearTokens()
    } else {
      writeTokens(next)
    }
  }, [])

  const logout = useCallback(() => {
    applyTokens(null)
    setUser(null)
    setStatus('anonymous')
  }, [applyTokens])

  // Wire the fetch client to our token state exactly once.
  useEffect(() => {
    setAuthAccessTokenProvider(() => tokensRef.current?.accessToken ?? null)
    setAuthRefreshHandler(async () => {
      const current = tokensRef.current
      if (current === null) return null
      try {
        const fresh = await refreshRequest(current.refreshToken)
        applyTokens(fresh)
        return fresh.accessToken
      } catch {
        applyTokens(null)
        setUser(null)
        setStatus('anonymous')
        return null
      }
    })
    return () => {
      setAuthAccessTokenProvider(() => null)
      setAuthRefreshHandler(null)
    }
  }, [applyTokens])

  // Bootstrap from localStorage: if we have tokens, try to fetch /me. On
  // failure, drop the tokens and stay anonymous.
  useEffect(() => {
    const stored = readTokens()
    if (stored === null) {
      // Transitioning from the initial "loading" status to "anonymous" is a
      // sync derivation from localStorage — the one-shot setState is the
      // whole point of the bootstrap effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('anonymous')
      return
    }
    tokensRef.current = stored
    let cancelled = false
    fetchMe()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        if (cancelled) return
        applyTokens(null)
        setUser(null)
        setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [applyTokens])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await loginRequest({ email, password })
      applyTokens(tokens)
      try {
        const me = await fetchMe()
        setUser(me)
        setStatus('authenticated')
      } catch (err) {
        // If /me fails right after login, roll back the token write so we
        // don't leave the app in a half-authed state.
        applyTokens(null)
        setUser(null)
        setStatus('anonymous')
        throw err
      }
    },
    [applyTokens],
  )

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const created = await registerRequest({ email, password, displayName })
      // Registration does not return tokens — caller usually follows up with
      // login(); we surface the created user so pages can decide what to do.
      return created
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Re-export ApiError so callers can narrow error types without importing
// from two places.
export { ApiError }

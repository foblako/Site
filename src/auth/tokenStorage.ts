/**
 * Persistent storage for the JWT pair. Plain localStorage is used on
 * purpose — the app does not process payments or sensitive data, so the
 * usual XSS vs. CSRF trade-off lands on localStorage being more convenient
 * (no refresh dance on every reload). If that ever changes, swap this
 * module for an `httpOnly`-cookie-based flow.
 */

import type { TokenPair } from '../types'

const STORAGE_KEY = 'auth.tokens'

export function readTokens(): TokenPair | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TokenPair>
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string'
    ) {
      return null
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: typeof parsed.tokenType === 'string' ? parsed.tokenType : 'bearer',
    }
  } catch {
    return null
  }
}

export function writeTokens(tokens: TokenPair): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

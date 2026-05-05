import type { AuthUser, TokenPair } from '../types'
import { apiRequest } from './client'

export type RegisterPayload = {
  email: string
  password: string
  displayName: string
}

export type LoginPayload = {
  email: string
  password: string
}

/**
 * Register a new account. Returns the created user (no tokens — caller
 * typically follows up with `login()` to receive the token pair).
 */
export function register(payload: RegisterPayload, signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: payload,
    signal,
    auth: false,
  })
}

export function login(payload: LoginPayload, signal?: AbortSignal): Promise<TokenPair> {
  return apiRequest<TokenPair>('/api/auth/login', {
    method: 'POST',
    body: payload,
    signal,
    auth: false,
  })
}

export function refresh(refreshToken: string, signal?: AbortSignal): Promise<TokenPair> {
  return apiRequest<TokenPair>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    signal,
    auth: false,
  })
}

export function fetchMe(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/me', { signal })
}

import type { UserProfile } from '../types'
import { apiRequest } from './client'

export type PortfolioPatch = Partial<UserProfile>

export function fetchDefaultPortfolio(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/portfolio/default', { signal, auth: false })
}

export function fetchMyPortfolio(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/portfolio/me', { signal })
}

export function updateMyPortfolio(
  patch: PortfolioPatch,
  signal?: AbortSignal,
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/portfolio/me', {
    method: 'PATCH',
    body: patch,
    signal,
  })
}

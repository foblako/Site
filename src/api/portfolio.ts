import type { UserProfile } from '../types'
import { apiRequest } from './client'

export function fetchDefaultPortfolio(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/portfolio/default', { signal })
}

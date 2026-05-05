import type { HallOfFameStar } from '../types'
import { apiRequest } from './client'

export function fetchHallOfFame(signal?: AbortSignal): Promise<HallOfFameStar[]> {
  return apiRequest<HallOfFameStar[]>('/api/hall-of-fame', { signal })
}

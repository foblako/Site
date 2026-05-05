import type { Direction } from '../types'
import { apiRequest } from './client'

export function fetchDirections(signal?: AbortSignal): Promise<Direction[]> {
  return apiRequest<Direction[]>('/api/directions', { signal })
}

import type { Vacancy } from '../types'
import { apiRequest } from './client'

export function fetchVacancies(signal?: AbortSignal): Promise<Vacancy[]> {
  return apiRequest<Vacancy[]>('/api/vacancies', { signal })
}

export function fetchVacancy(id: number, signal?: AbortSignal): Promise<Vacancy> {
  return apiRequest<Vacancy>(`/api/vacancies/${id}`, { signal })
}

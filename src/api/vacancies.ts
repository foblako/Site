import type { Vacancy, VacancyApplication } from '../types'
import { apiRequest } from './client'

export function fetchVacancies(signal?: AbortSignal): Promise<Vacancy[]> {
  return apiRequest<Vacancy[]>('/api/vacancies', { signal })
}

export function fetchVacancy(id: number, signal?: AbortSignal): Promise<Vacancy> {
  return apiRequest<Vacancy>(`/api/vacancies/${id}`, { signal })
}

export function applyToVacancy(
  id: number,
  message: string,
  signal?: AbortSignal,
): Promise<VacancyApplication> {
  return apiRequest<VacancyApplication>(`/api/vacancies/${id}/apply`, {
    method: 'POST',
    body: { message },
    signal,
  })
}

export function withdrawVacancyApplication(
  id: number,
  signal?: AbortSignal,
): Promise<void> {
  return apiRequest<void>(`/api/vacancies/${id}/apply`, { method: 'DELETE', signal })
}

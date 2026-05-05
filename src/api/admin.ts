/**
 * Admin-only CRUD helpers. Every call expects the caller to be authenticated
 * as an admin — a 403 surfaces as `ApiError` for the UI to render.
 *
 * Project/vacancy bodies intentionally use `unknown` payload shapes: the admin
 * form is a JSON textarea (an "escape hatch" tool for the department lead,
 * not a polished end-user editor), so we forward whatever the admin pastes
 * straight through and let the backend validate it.
 */

import type { Direction, HallOfFameStar, ProjectDetail, Vacancy } from '../types'
import { apiRequest } from './client'

export type AdminVacancyApplication = {
  id: string
  vacancyId: number
  message: string
  createdAt: string
  applicant: {
    id: string
    email: string
    displayName: string
    avatarUrl: string | null
  }
}

// ----- projects -----

export function createProject(payload: unknown, signal?: AbortSignal): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>('/api/admin/projects', { method: 'POST', body: payload, signal })
}

export function updateProject(
  id: string,
  payload: unknown,
  signal?: AbortSignal,
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/api/admin/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
    signal,
  })
}

export function deleteProject(id: string, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/api/admin/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  })
}

// ----- vacancies -----

export function createVacancy(payload: unknown, signal?: AbortSignal): Promise<Vacancy> {
  return apiRequest<Vacancy>('/api/admin/vacancies', { method: 'POST', body: payload, signal })
}

export function updateVacancy(
  id: number,
  payload: unknown,
  signal?: AbortSignal,
): Promise<Vacancy> {
  return apiRequest<Vacancy>(`/api/admin/vacancies/${id}`, {
    method: 'PATCH',
    body: payload,
    signal,
  })
}

export function deleteVacancy(id: number, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/api/admin/vacancies/${id}`, { method: 'DELETE', signal })
}

export function fetchVacancyApplications(
  vacancyId: number,
  signal?: AbortSignal,
): Promise<AdminVacancyApplication[]> {
  return apiRequest<AdminVacancyApplication[]>(
    `/api/admin/vacancies/${vacancyId}/applications`,
    { signal },
  )
}

// ----- directions -----

export function createDirection(
  payload: { name: string; technologies: string[] },
  signal?: AbortSignal,
): Promise<Direction> {
  return apiRequest<Direction>('/api/admin/directions', {
    method: 'POST',
    body: payload,
    signal,
  })
}

export function updateDirection(
  id: number,
  payload: { name?: string; technologies?: string[] },
  signal?: AbortSignal,
): Promise<Direction> {
  return apiRequest<Direction>(`/api/admin/directions/${id}`, {
    method: 'PATCH',
    body: payload,
    signal,
  })
}

export function deleteDirection(id: number, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/api/admin/directions/${id}`, { method: 'DELETE', signal })
}

// ----- stars (hall of fame) -----

export function createStar(
  payload: { name: string; role: string; avatar: string },
  signal?: AbortSignal,
): Promise<HallOfFameStar> {
  return apiRequest<HallOfFameStar>('/api/admin/stars', {
    method: 'POST',
    body: payload,
    signal,
  })
}

export function updateStar(
  id: number,
  payload: { name?: string; role?: string; avatar?: string },
  signal?: AbortSignal,
): Promise<HallOfFameStar> {
  return apiRequest<HallOfFameStar>(`/api/admin/stars/${id}`, {
    method: 'PATCH',
    body: payload,
    signal,
  })
}

export function deleteStar(id: number, signal?: AbortSignal): Promise<void> {
  return apiRequest<void>(`/api/admin/stars/${id}`, { method: 'DELETE', signal })
}

import type { ProjectDetail, ProjectLikeResponse, ProjectSummary } from '../types'
import { apiRequest } from './client'

export function fetchProjects(signal?: AbortSignal): Promise<ProjectSummary[]> {
  // `auth: false` for the initial paint, but the caller can refetch after
  // login to pick up `likedByMe` flags; `apiRequest` will attach the token
  // automatically when `auth` is left at its default (true).
  return apiRequest<ProjectSummary[]>('/api/projects', { signal })
}

export function fetchProject(id: string, signal?: AbortSignal): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/api/projects/${encodeURIComponent(id)}`, { signal })
}

export function toggleProjectLike(
  id: string,
  signal?: AbortSignal,
): Promise<ProjectLikeResponse> {
  return apiRequest<ProjectLikeResponse>(
    `/api/projects/${encodeURIComponent(id)}/like`,
    { method: 'POST', signal },
  )
}

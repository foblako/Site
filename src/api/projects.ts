import type { ProjectDetail, ProjectSummary } from '../types'
import { apiRequest } from './client'

export function fetchProjects(signal?: AbortSignal): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>('/api/projects', { signal })
}

export function fetchProject(id: string, signal?: AbortSignal): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/api/projects/${encodeURIComponent(id)}`, { signal })
}

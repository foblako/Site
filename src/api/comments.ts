import type { Comment } from '../types'
import { apiRequest } from './client'

export function fetchProjectComments(
  projectId: string,
  signal?: AbortSignal,
): Promise<Comment[]> {
  return apiRequest<Comment[]>(
    `/api/projects/${encodeURIComponent(projectId)}/comments`,
    { signal, auth: false },
  )
}

export function createProjectComment(
  projectId: string,
  body: string,
  signal?: AbortSignal,
): Promise<Comment> {
  return apiRequest<Comment>(
    `/api/projects/${encodeURIComponent(projectId)}/comments`,
    { method: 'POST', body: { body }, signal },
  )
}

export function deleteProjectComment(
  projectId: string,
  commentId: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiRequest<void>(
    `/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE', signal },
  )
}

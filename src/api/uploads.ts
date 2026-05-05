import type { AuthUser } from '../types'
import { apiRequest } from './client'

export function uploadAvatar(file: File, signal?: AbortSignal): Promise<AuthUser> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<AuthUser>('/api/users/me/avatar', {
    method: 'POST',
    body: form,
    signal,
  })
}

export function deleteAvatar(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/users/me/avatar', { method: 'DELETE', signal })
}

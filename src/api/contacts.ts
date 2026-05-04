import { apiRequest } from './client'

export type DepartmentContacts = {
  phone: string
  email: string
}

export function fetchDepartmentContacts(signal?: AbortSignal): Promise<DepartmentContacts> {
  return apiRequest<DepartmentContacts>('/api/contacts/department', { signal })
}

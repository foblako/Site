/**
 * Thin `fetch` wrapper around the FastAPI backend.
 *
 * The base URL is read from `VITE_API_URL` at build time (defaults to the
 * local dev server `http://localhost:8000`). All API responses are JSON;
 * non-2xx statuses are turned into `ApiError` so callers can `try/catch`.
 */

const RAW_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

// Strip a trailing slash so we can naively concatenate `${base}/api/...`.
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, message: string, detail: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
    signal,
  })

  if (!response.ok) {
    let detail: unknown = null
    try {
      detail = await response.json()
    } catch {
      // Non-JSON error body (e.g. HTML 502 from a proxy) — ignore.
    }
    const message =
      typeof detail === 'object' && detail !== null && 'detail' in detail
        ? String((detail as { detail: unknown }).detail)
        : `Request to ${path} failed with status ${response.status}`
    throw new ApiError(response.status, message, detail)
  }

  // Some endpoints (e.g. 204 No Content) have no body; cast to T at the call
  // site using `apiRequest<void>(...)`.
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

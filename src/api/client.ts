/**
 * Thin `fetch` wrapper around the FastAPI backend.
 *
 * The base URL is read from `VITE_API_URL` at build time (defaults to the
 * local dev server `http://localhost:8000`). All API responses are JSON;
 * non-2xx statuses are turned into `ApiError` so callers can `try/catch`.
 *
 * Authentication is injected through two callbacks the auth layer registers
 * at startup (`setAuthAccessTokenProvider`, `setAuthRefreshHandler`) so this
 * module stays React-free and auth-free on its own.
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
  /**
   * If true (default), attach the current access token and, on 401, try once
   * to refresh and retry. Set to false for endpoints that must stay anonymous
   * (the login/register/refresh calls themselves).
   */
  auth?: boolean
}

type AccessTokenProvider = () => string | null
type RefreshHandler = () => Promise<string | null>

let accessTokenProvider: AccessTokenProvider = () => null
let refreshHandler: RefreshHandler | null = null

export function setAuthAccessTokenProvider(provider: AccessTokenProvider): void {
  accessTokenProvider = provider
}

/**
 * Register the function that the client calls once, on a 401 from an
 * authenticated request, to obtain a fresh access token. Return `null` to
 * signal that refresh failed and the original 401 should bubble up.
 */
export function setAuthRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler
}

// A single in-flight refresh is shared across concurrent 401s so we do not
// spam the backend with parallel /auth/refresh calls.
let pendingRefresh: Promise<string | null> | null = null

async function runRefresh(): Promise<string | null> {
  if (refreshHandler === null) return null
  if (pendingRefresh !== null) return pendingRefresh
  pendingRefresh = refreshHandler().finally(() => {
    pendingRefresh = null
  })
  return pendingRefresh
}

async function performFetch(
  path: string,
  method: RequestOptions['method'],
  payload: BodyInit | undefined,
  baseHeaders: Record<string, string>,
  signal: AbortSignal | undefined,
  accessToken: string | null,
): Promise<Response> {
  const headers = { ...baseHeaders }
  if (accessToken !== null) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return fetch(`${BASE_URL}${path}`, { method, headers, body: payload, signal })
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, auth = true } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const initialToken = auth ? accessTokenProvider() : null
  let response = await performFetch(path, method, payload, headers, signal, initialToken)

  // Single retry on 401 for authenticated requests — obtain a fresh access
  // token via the refresh handler and retry once. Anything else (or a second
  // 401) bubbles up as an ApiError(401).
  if (response.status === 401 && auth && initialToken !== null) {
    const freshToken = await runRefresh()
    if (freshToken !== null) {
      response = await performFetch(path, method, payload, headers, signal, freshToken)
    }
  }

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

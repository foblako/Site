/**
 * Tiny `useApi` hook — runs an async fetcher on mount, exposes
 * `{ data, error, loading }`, and aborts in-flight requests on unmount or
 * when dependencies change.
 *
 * No external library (no react-query/swr) — just enough to power the
 * read-only screens. We can swap in a real fetching library once we hit
 * cache invalidation / mutations / refetches.
 */

import { useEffect, useState } from 'react'

export type ApiState<T> = {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

type Fetcher<T> = (signal: AbortSignal) => Promise<T>

export function useApi<T>(
  fetcher: Fetcher<T>,
  deps: ReadonlyArray<unknown> = [],
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  })

  useEffect(() => {
    const controller = new AbortController()
    setState({ data: undefined, error: undefined, loading: true })
    fetcher(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setState({ data, error: undefined, loading: false })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({
          data: undefined,
          error: err instanceof Error ? err : new Error(String(err)),
          loading: false,
        })
      })
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

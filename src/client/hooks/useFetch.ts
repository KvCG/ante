import { useState, useCallback } from 'react'
import { api } from '../services/api'

interface UseFetchReturn<T> {
    data: T | null
    loading: boolean
    error: string | null
    fetch: (endpoint: string, options?: RequestInit) => Promise<void>
    reset: () => void
}

/**
 * Generic data fetching hook
 * 
 * Usage:
 * const { data, loading, error, fetch } = useFetch<UserData>()
 * 
 * useEffect(() => {
 *     fetch('/api/users/123')
 * }, [])
 */
export function useFetch<T>(): UseFetchReturn<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetch = useCallback(async (endpoint: string, options?: RequestInit) => {
        setLoading(true)
        setError(null)

        try {
            const result = await api.get<T>(endpoint, options)
            setData(result)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data'
            setError(message)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setLoading(false)
    }, [])

    return { data, loading, error, fetch, reset }
}

/**
 * POST data hook
 */
export function usePost<TRequest, TResponse>(): {
    data: TResponse | null
    loading: boolean
    error: string | null
    post: (endpoint: string, body: TRequest) => Promise<TResponse | null>
    reset: () => void
} {
    const [data, setData] = useState<TResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const post = useCallback(async (endpoint: string, body: TRequest): Promise<TResponse | null> => {
        setLoading(true)
        setError(null)

        try {
            const result = await api.post<TResponse>(endpoint, body)
            setData(result)
            return result
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to submit data'
            setError(message)
            setData(null)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setLoading(false)
    }, [])

    return { data, loading, error, post, reset }
}

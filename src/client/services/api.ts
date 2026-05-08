import { getApiBaseUrl } from './config'
import { generateRequestId } from './requestId'

const baseUrl = getApiBaseUrl()

/**
 * API client with automatic request ID propagation
 */
export const api = {
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-request-id': generateRequestId(),
                ...options?.headers,
            },
            ...options,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }))
            throw new Error(error.error || `HTTP ${response.status}`)
        }

        return response.json()
    },

    async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-request-id': generateRequestId(),
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            ...options,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }))
            throw new Error(error.error || `HTTP ${response.status}`)
        }

        return response.json()
    },

    async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-request-id': generateRequestId(),
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            ...options,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }))
            throw new Error(error.error || `HTTP ${response.status}`)
        }

        return response.json()
    },

    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-request-id': generateRequestId(),
                ...options?.headers,
            },
            ...options,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }))
            throw new Error(error.error || `HTTP ${response.status}`)
        }

        return response.json()
    },
}

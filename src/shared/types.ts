/**
 * Shared types used across client and server
 */

/** Standard API response wrapper */
export interface ApiResponse<T> {
    data: T
    success: boolean
    error?: string
    timestamp: string
}

/** Pagination parameters */
export interface PaginationParams {
    limit: number
    offset: number
}

/** Paginated response */
export interface PaginatedResponse<T> {
    items: T[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
}

/** API error response */
export interface ApiError {
    error: string
    code: string
    context?: Record<string, unknown>
}

/** Feature flag state */
export interface FeatureFlags {
    [key: string]: boolean
}

/** Health check response */
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded'
    uptime?: number
    timestamp: string
    version?: string
    checks?: Record<string, {
        status: 'pass' | 'fail' | 'warn'
        message?: string
    }>
}

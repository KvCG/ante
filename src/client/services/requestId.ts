/**
 * Client-side request ID generation for tracing
 */

/**
 * Generate a unique request ID
 * Uses crypto.randomUUID when available, falls back to timestamp + random
 */
export function generateRequestId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    
    // Fallback for older browsers
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get or create a session-level correlation ID
 * Useful for grouping related requests within a user session
 */
let sessionCorrelationId: string | null = null

export function getSessionCorrelationId(): string {
    if (!sessionCorrelationId) {
        sessionCorrelationId = generateRequestId()
    }
    return sessionCorrelationId
}

/**
 * Reset session correlation ID (e.g., on logout)
 */
export function resetSessionCorrelationId(): void {
    sessionCorrelationId = null
}

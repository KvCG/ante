import crypto from 'crypto'
import { Request, Response } from 'express'

/**
 * Extract request ID from various sources
 */
export function extractRequestId(req: Request, res?: Response): string | undefined {
    return (
        req?.headers?.['x-request-id'] as string ||
        res?.getHeader?.('x-request-id') as string ||
        req?.headers?.['x-correlation-id'] as string ||
        (req as { id?: string })?.id ||
        undefined
    )
}

/**
 * Resolve or create a correlation ID for the request
 * 
 * Priority:
 * 1. Incoming x-correlation-id header (for distributed tracing)
 * 2. Incoming x-request-id header
 * 3. Generate a new UUID
 */
export function resolveOrCreateCorrelationId(req: Request): string {
    const incoming = 
        req?.headers?.['x-correlation-id'] as string ||
        req?.headers?.['x-request-id'] as string

    if (incoming) {
        return incoming
    }

    return generateId()
}

/**
 * Generate a unique identifier
 */
export function generateId(): string {
    // Use crypto.randomUUID if available (Node 14.17+)
    if (crypto.randomUUID) {
        return crypto.randomUUID()
    }
    // Fallback for older Node versions
    return crypto.randomBytes(16).toString('hex')
}

import { Request, Response, NextFunction } from 'express'
import { resolveOrCreateCorrelationId } from '../utils/requestIdentity'

/**
 * Correlation ID middleware
 * 
 * Ensures every request has a correlation ID that can be traced
 * through logs and downstream service calls.
 */
export function correlationIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const correlationId = resolveOrCreateCorrelationId(req)
    
    // Set headers for downstream propagation
    res.setHeader('x-correlation-id', correlationId)
    res.setHeader('x-request-id', correlationId)
    
    // Attach to request for use in handlers
    req.correlationId = correlationId
    
    next()
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            correlationId?: string
            validatedQuery?: Record<string, unknown>
            validatedBody?: Record<string, unknown>
        }
    }
}

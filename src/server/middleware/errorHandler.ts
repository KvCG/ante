import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/customErrors'
import { logger } from '../logging/logger'

/**
 * Global error handler middleware
 * 
 * IMPORTANT: Register this LAST in your middleware chain
 * 
 * Features:
 * - Handles custom AppError subclasses with appropriate status codes
 * - Logs errors with context
 * - Returns consistent JSON error responses
 * - Shows stack traces in development only
 */
export function globalErrorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Prevent double-sending responses
    if (res.headersSent) {
        logger.error({ err }, 'Error after headers sent')
        return
    }

    // Handle custom application errors
    if (err instanceof AppError) {
        logger.warn(
            { 
                err: { message: err.message, code: err.code, context: err.context },
                route: req.path,
                method: req.method,
            },
            err.message
        )
        res.status(err.statusCode).json(err.toJSON())
        return
    }

    // Handle unknown/unexpected errors
    logger.error(
        { 
            err,
            route: req.path,
            method: req.method,
        },
        'Unhandled error'
    )
    
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            message: err.message,
        }),
    })
}

/**
 * Wrap async route handlers to catch errors
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation()
 *     res.json(data)
 * }))
 */
export function asyncHandler<T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

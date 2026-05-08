/**
 * Custom Error Classes
 * 
 * Use these error classes throughout the application for consistent error handling.
 * The global error handler will catch and format these appropriately.
 */

/** Base application error - all custom errors extend this */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public context?: Record<string, unknown>
    ) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON() {
        return {
            error: this.message,
            code: this.code,
            ...(process.env.NODE_ENV === 'development' && this.context && { context: this.context }),
        }
    }
}

/** Validation errors (400) - invalid input, missing fields */
export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, context)
    }
}

/** External API errors (502) - upstream failures */
export class ExternalApiError extends AppError {
    constructor(message: string, upstream: string = 'unknown', context?: Record<string, unknown>) {
        super(message, 'EXTERNAL_API_ERROR', 502, { ...context, upstream })
    }
}

/** Not found errors (404) */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', identifier?: string) {
        const message = identifier 
            ? `${resource} '${identifier}' not found` 
            : `${resource} not found`
        super(message, 'NOT_FOUND', 404)
    }
}

/** Feature disabled errors (404) - feature flags off */
export class FeatureDisabledError extends AppError {
    constructor(featureName: string) {
        super(
            `Feature '${featureName}' is not available`,
            'FEATURE_DISABLED',
            404,
            { feature: featureName }
        )
    }
}

/** Rate limit errors (429) */
export class RateLimitError extends AppError {
    constructor(retryAfterMs: number = 1000) {
        super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, { retryAfterMs })
    }
}

/** Unauthorized errors (401) */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401)
    }
}

/** Forbidden errors (403) */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 'FORBIDDEN', 403)
    }
}

/** Conflict errors (409) - duplicate resources, version conflicts */
export class ConflictError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'CONFLICT', 409, context)
    }
}

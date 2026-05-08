import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../errors/customErrors'

/**
 * Query parameter validation middleware factory
 * 
 * Usage:
 * const schema = z.object({
 *     limit: z.string().transform(v => parseInt(v, 10)),
 *     offset: z.string().optional(),
 * })
 * router.get('/items', validateQuery(schema), handler)
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const validated = schema.parse(req.query)
            req.validatedQuery = validated
            next()
        } catch (error) {
            if (error instanceof ZodError) {
                const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
                next(new ValidationError('Invalid query parameters', { issues }))
            } else {
                next(error)
            }
        }
    }
}

/**
 * Request body validation middleware factory
 * 
 * Usage:
 * const schema = z.object({
 *     name: z.string().min(1),
 *     email: z.string().email(),
 * })
 * router.post('/users', validateBody(schema), handler)
 */
export function validateBody<T extends ZodSchema>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const validated = schema.parse(req.body)
            req.validatedBody = validated
            next()
        } catch (error) {
            if (error instanceof ZodError) {
                const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
                next(new ValidationError('Invalid request body', { issues }))
            } else {
                next(error)
            }
        }
    }
}

/**
 * Route params validation middleware factory
 */
export function validateParams<T extends ZodSchema>(schema: T) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.params)
            next()
        } catch (error) {
            if (error instanceof ZodError) {
                const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
                next(new ValidationError('Invalid route parameters', { issues }))
            } else {
                next(error)
            }
        }
    }
}

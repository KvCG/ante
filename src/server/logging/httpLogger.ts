import pinoHttp from 'pino-http'
import { logger } from './logger'
import { extractRequestId, resolveOrCreateCorrelationId } from '../utils/requestIdentity'

/**
 * HTTP request/response logger middleware
 * 
 * Features:
 * - Automatic request ID generation and propagation
 * - Excludes health check endpoints from logging
 * - Logs request duration and status
 */
export const httpLogger = pinoHttp({
    logger,
    
    // Generate/extract request ID
    genReqId: (req, res) => {
        const id = extractRequestId(req, res) || resolveOrCreateCorrelationId(req)
        res.setHeader('x-request-id', id)
        return id
    },
    
    // Exclude noisy endpoints
    autoLogging: {
        ignore: (req) => {
            const url = req.url || ''
            return (
                url.startsWith('/health') ||
                url.startsWith('/api/status') ||
                url.startsWith('/api/ready')
            )
        },
    },
    
    // Customize logged request data
    customProps: (req) => ({
        correlationId: req.headers['x-correlation-id'],
    }),
    
    // Customize success message
    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`
    },
    
    // Customize error message
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`
    },
})

export default httpLogger

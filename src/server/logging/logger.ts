import pino from 'pino'

const NODE_ENV = process.env.NODE_ENV || 'development'
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug')

const isDev = NODE_ENV === 'development'

// Configure pino-pretty for development
let transport: pino.TransportSingleOptions | undefined
if (isDev) {
    transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    }
}

/**
 * Structured logger with Pino
 * 
 * Features:
 * - JSON output in production for log aggregation
 * - Pretty printing in development
 * - Automatic redaction of sensitive fields
 * - Configurable log level via LOG_LEVEL env var
 */
export const logger = pino({
    level: LOG_LEVEL,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'password',
            'secret',
            'token',
            'apiKey',
        ],
        remove: true,
    },
    ...(transport && { transport }),
})

export default logger

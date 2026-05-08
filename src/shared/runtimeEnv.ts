/**
 * Runtime Environment Detection
 * 
 * Centralized environment detection that works across client and server.
 * Use this instead of checking process.env directly in business logic.
 */

export type AppEnv = 'prod' | 'dev' | 'local'

interface RuntimeEnvInput {
    NODE_ENV?: string
    VERCEL_ENV?: string
    RENDER?: string
    FLY_APP_NAME?: string
    // Add other deployment platform env vars as needed
}

/**
 * Detect the application environment
 * 
 * Priority:
 * 1. VERCEL_ENV (Vercel deployment)
 * 2. RENDER (Render deployment)
 * 3. FLY_APP_NAME (Fly.io deployment)
 * 4. NODE_ENV
 * 5. Default to 'local'
 */
export function detectAppEnv(env: RuntimeEnvInput): AppEnv {
    // Vercel detection
    if (env.VERCEL_ENV === 'production') return 'prod'
    if (env.VERCEL_ENV === 'preview') return 'dev'

    // Render detection
    if (env.RENDER === 'true') {
        return env.NODE_ENV === 'production' ? 'prod' : 'dev'
    }

    // Fly.io detection
    if (env.FLY_APP_NAME) {
        return env.NODE_ENV === 'production' ? 'prod' : 'dev'
    }

    // NODE_ENV fallback
    if (env.NODE_ENV === 'production') return 'prod'
    if (env.NODE_ENV === 'development') return 'local'

    return 'local'
}

/**
 * Check if running in local development
 */
export function isLocalAppEnv(env: RuntimeEnvInput): boolean {
    return detectAppEnv(env) === 'local'
}

/**
 * Check if running in production
 */
export function isProductionAppEnv(env: RuntimeEnvInput): boolean {
    return detectAppEnv(env) === 'prod'
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig<T>(env: RuntimeEnvInput, configs: Record<AppEnv, T>): T {
    const appEnv = detectAppEnv(env)
    return configs[appEnv]
}

// Server-side convenience exports
export const serverEnv = typeof process !== 'undefined' ? detectAppEnv(process.env) : 'local'
export const isLocal = typeof process !== 'undefined' ? isLocalAppEnv(process.env) : true
export const isProduction = typeof process !== 'undefined' ? isProductionAppEnv(process.env) : false

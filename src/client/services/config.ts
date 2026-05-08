/**
 * Environment-based API configuration
 * 
 * Automatically selects the correct API URL based on the current environment.
 */

type AppEnv = 'prod' | 'dev' | 'local'

interface EnvConfig {
    apiBaseUrl: string
}

const configs: Record<AppEnv, EnvConfig> = {
    prod: {
        apiBaseUrl: '', // Same-origin in production (served by same host)
    },
    dev: {
        apiBaseUrl: '', // Same-origin for preview deployments
    },
    local: {
        apiBaseUrl: 'http://localhost:3000', // Local backend server
    },
}

/**
 * Detect current environment based on hostname
 */
function detectEnv(): AppEnv {
    if (typeof window === 'undefined') {
        return 'local'
    }

    const hostname = window.location.hostname

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'local'
    }

    // Vercel preview deployments (customize domain as needed)
    if (hostname.includes('vercel.app') && !hostname.includes('production')) {
        return 'dev'
    }

    // Production (customize for your domain)
    return 'prod'
}

/**
 * Get the API base URL for the current environment
 */
export function getApiBaseUrl(): string {
    const env = detectEnv()
    return configs[env].apiBaseUrl
}

/**
 * Get full configuration for current environment
 */
export function getConfig(): EnvConfig {
    const env = detectEnv()
    return configs[env]
}

/**
 * Get current detected environment
 */
export function getCurrentEnv(): AppEnv {
    return detectEnv()
}

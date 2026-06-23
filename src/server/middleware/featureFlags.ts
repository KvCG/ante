import { Request, Response, NextFunction } from 'express'
import { FeatureDisabledError } from '../errors/customErrors'

/**
 * Feature flags configuration
 * 
 * Define feature flags as functions that return boolean.
 * This allows for complex conditions (env vars, dates, user segments, etc.)
 * 
 * Usage:
 * - Set ENABLE_FEATURE_NAME=true in .env to enable
 * - Add new features here as they're developed
 */
const featureFlags: Record<string, () => boolean> = {
    analytics: () => process.env.ENABLE_ANALYTICS === 'true',
    betaFeatures: () => process.env.ENABLE_BETA_FEATURES === 'true',
    
    // Time-based example
    newYearFeature: () => {
        const now = new Date()
        return now.getMonth() === 0 && now.getDate() <= 7 // First week of January
    },
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
    const flag = featureFlags[featureName]
    return flag ? flag() : false
}

/**
 * Middleware factory to require a feature flag
 * 
 * Usage:
 * router.get('/beta-endpoint', requireFeature('betaFeatures'), handler)
 */
export function requireFeature(featureName: string) {
    return (_req: Request, _res: Response, next: NextFunction): void => {
        if (isFeatureEnabled(featureName)) {
            next()
        } else {
            next(new FeatureDisabledError(featureName))
        }
    }
}

/**
 * Get all feature flag states (useful for debugging/admin endpoints)
 */
export function getAllFeatureStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {}
    for (const [name, fn] of Object.entries(featureFlags)) {
        states[name] = fn()
    }
    return states
}

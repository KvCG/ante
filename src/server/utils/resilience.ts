/**
 * Simple utilities for async operations
 */

/**
 * Delay execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry options
 */
interface RetryOptions {
    maxRetries?: number
    baseDelayMs?: number
    maxDelayMs?: number
    shouldRetry?: (error: Error) => boolean
}

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * Usage:
 * const result = await withRetry(
 *     () => fetchExternalApi(),
 *     { maxRetries: 3, baseDelayMs: 1000 }
 * )
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelayMs = 1000,
        maxDelayMs = 30000,
        shouldRetry = () => true,
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error as Error

            if (attempt === maxRetries || !shouldRetry(lastError)) {
                throw lastError
            }

            const delayMs = Math.min(
                baseDelayMs * Math.pow(2, attempt),
                maxDelayMs
            )
            await delay(delayMs)
        }
    }

    throw lastError
}

/**
 * Timeout wrapper
 * 
 * Usage:
 * const result = await withTimeout(
 *     () => slowOperation(),
 *     5000,
 *     'Operation timed out'
 * )
 */
export async function withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    message: string = 'Operation timed out'
): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(message)), timeoutMs)
        ),
    ])
}

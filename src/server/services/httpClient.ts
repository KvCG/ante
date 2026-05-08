import axios, { AxiosInstance, AxiosError } from 'axios'
import { logger } from '../logging/logger'
import { ExternalApiError } from '../errors/customErrors'

interface HttpClientConfig {
    baseURL: string
    timeout?: number
}

/**
 * Simple HTTP Client for external API integrations
 * 
 * Usage:
 * const client = createHttpClient({ baseURL: 'https://api.example.com' })
 * const data = await client.get<User>('/users/1')
 */
export class HttpClient {
    private client: AxiosInstance

    constructor(config: HttpClientConfig) {
        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
        })

        this.setupInterceptors()
    }

    private setupInterceptors(): void {
        // Request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                logger.debug({ url: config.url, method: config.method }, 'HTTP request')
                return config
            },
            (error) => Promise.reject(error)
        )

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(
                    { url: response.config.url, status: response.status },
                    'HTTP response'
                )
                return response
            },
            (error) => Promise.reject(error)
        )
    }

    private classifyError(error: AxiosError): { type: string; message: string } {
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                return { type: 'timeout', message: 'Request timed out' }
            }
            return { type: 'network', message: 'Network error' }
        }

        const status = error.response.status
        if (status >= 400 && status < 500) {
            return { type: 'client_error', message: `Client error: ${status}` }
        }
        if (status >= 500) {
            return { type: 'server_error', message: `Server error: ${status}` }
        }
        return { type: 'unknown', message: 'Unknown error' }
    }

    async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
        try {
            const response = await this.client.get<T>(path, { params })
            return response.data
        } catch (error) {
            const axiosError = error as AxiosError
            const { type, message } = this.classifyError(axiosError)
            logger.error({ path, errorType: type }, message)
            throw new ExternalApiError(message, 'HTTP_CLIENT', { path, errorType: type })
        }
    }

    async post<T>(path: string, data?: unknown): Promise<T> {
        try {
            const response = await this.client.post<T>(path, data)
            return response.data
        } catch (error) {
            const axiosError = error as AxiosError
            const { type, message } = this.classifyError(axiosError)
            logger.error({ path, errorType: type }, message)
            throw new ExternalApiError(message, 'HTTP_CLIENT', { path, errorType: type })
        }
    }

    async put<T>(path: string, data?: unknown): Promise<T> {
        try {
            const response = await this.client.put<T>(path, data)
            return response.data
        } catch (error) {
            const axiosError = error as AxiosError
            const { type, message } = this.classifyError(axiosError)
            logger.error({ path, errorType: type }, message)
            throw new ExternalApiError(message, 'HTTP_CLIENT', { path, errorType: type })
        }
    }

    async delete<T>(path: string): Promise<T> {
        try {
            const response = await this.client.delete<T>(path)
            return response.data
        } catch (error) {
            const axiosError = error as AxiosError
            const { type, message } = this.classifyError(axiosError)
            logger.error({ path, errorType: type }, message)
            throw new ExternalApiError(message, 'HTTP_CLIENT', { path, errorType: type })
        }
    }
}

/**
 * Factory function to create configured HTTP clients
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
    return new HttpClient(config)
}

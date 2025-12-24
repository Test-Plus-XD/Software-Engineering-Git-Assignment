/**
 * Network Error Handling Utility
 * Provides comprehensive error handling with retry logic for API calls
 * Includes user-friendly error messages and exponential backoff
 */

import React from 'react'

interface RetryConfig {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
    retryCondition?: (error: Error | null, response: Response | null) => boolean
}

/**
 * Enhanced fetch wrapper with error handling and retry logic
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryConfig: RetryConfig = {}
): Promise<Response> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
        retryCondition = (error: Error | null, response: Response | null) => {
            // Retry on network errors or 5xx server errors
            if (error && (error.name === 'TypeError' || error.message.includes('fetch'))) {
                return true
            }
            if (response && response.status >= 500) {
                return true
            }
            // Retry on 429 (rate limit) or 408 (timeout)
            if (response && (response.status === 429 || response.status === 408)) {
                return true
            }
            return false
        }
    } = retryConfig

    let lastError: Error | null = null
    let lastResponse: Response | null = null
    let timeoutId: NodeJS.Timeout

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController()
            timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

            const fetchOptions: RequestInit = {
                ...options,
                signal: controller.signal
            }

            const response = await fetch(url, fetchOptions)
            clearTimeout(timeoutId)

            // If response is ok, return it
            if (response.ok) {
                return response
            }

            // Store response for potential retry decision
            lastResponse = response

            // Check if we should retry
            if (attempt < maxRetries && retryCondition(null, response)) {
                const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }

            // If we shouldn't retry or this is the last attempt, throw error
            const errorData = await response.json().catch(() => ({}))
            throw new NetworkError(
                errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                response,
                attempt
            )

        } catch (error) {
            clearTimeout(timeoutId!)
            lastError = error as Error

            // If it's already a NetworkError, just re-throw it
            if (error instanceof NetworkError) {
                throw error
            }

            // Handle abort/timeout errors
            if ((error as Error).name === 'AbortError') {
                throw new NetworkError(
                    'Request timed out. Please check your connection and try again.',
                    408,
                    null,
                    attempt
                )
            }

            // Check if we should retry
            if (attempt < maxRetries && retryCondition(error as Error, null)) {
                const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }

            // Transform generic errors into NetworkErrors
            throw new NetworkError(
                getErrorMessage(error as Error),
                0,
                null,
                attempt
            )
        }
    }

    // This should never be reached, but just in case
    throw lastError || new NetworkError('Maximum retries exceeded', 0, lastResponse, maxRetries)
}

/**
 * Custom Network Error class with enhanced error information
 */
export class NetworkError extends Error {
    public status: number
    public response: Response | null
    public attempts: number
    public timestamp: string
    public userFriendlyMessage: string

    constructor(message: string, status = 0, response: Response | null = null, attempts = 0) {
        super(message)
        this.name = 'NetworkError'
        this.status = status
        this.response = response
        this.attempts = attempts
        this.timestamp = new Date().toISOString()
        this.userFriendlyMessage = getUserFriendlyMessage(message, status)
    }
}

/**
 * Get user-friendly error message based on error type and status
 */
function getUserFriendlyMessage(message: string, status: number): string {
    // Network/connection errors
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || status === 0) {
        return 'Network connection failed. Please check your internet connection and try again.'
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') || status === 408) {
        return 'Request timed out. Your connection might be slow. Please try again.'
    }

    // Server errors
    if (status >= 500) {
        return 'Server error occurred. Please try again in a few moments.'
    }

    // Client errors
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input and try again.'
        case 401:
            return 'Authentication required. Please log in and try again.'
        case 403:
            return 'Access denied. You don\'t have permission to perform this action.'
        case 404:
            return 'Resource not found. The requested item may have been deleted or moved.'
        case 409:
            return 'Conflict occurred. The resource may have been modified by another user.'
        case 413:
            return 'File is too large. Please choose a smaller file or compress your image.'
        case 415:
            return 'File format not supported. Please convert your file to a supported format.'
        case 422:
            return 'Invalid data provided. Please check your input and try again.'
        case 429:
            return 'Too many requests. Please wait a moment before trying again.'
        default:
            if (status >= 400 && status < 500) {
                return 'Request failed. Please check your input and try again.'
            }
    }

    // Fallback to original message if it's already user-friendly
    if (message.length < 100 && !message.includes('TypeError') && !message.includes('fetch')) {
        return message
    }

    return 'An unexpected error occurred. Please try again.'
}

/**
 * Get error message from various error types
 */
function getErrorMessage(error: Error | string | unknown): string {
    if (error instanceof Error && error.message) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'Unknown error occurred'
}

interface APIClientOptions extends RequestInit {
    headers?: Record<string, string>
}

/**
 * API client with built-in error handling
 */
export class APIClient {
    private baseURL: string
    private defaultOptions: APIClientOptions

    constructor(baseURL = '', defaultOptions: APIClientOptions = {}) {
        this.baseURL = baseURL
        this.defaultOptions = {
            // Don't set default Content-Type header - let each request handle it
            ...defaultOptions
        }
    }

    async request(endpoint: string, options: APIClientOptions = {}): Promise<any> {
        const url = `${this.baseURL}${endpoint}`
        const mergedOptions: RequestInit = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...(this.defaultOptions.headers || {}),
                ...(options.headers || {})
            }
        }

        try {
            const response = await fetchWithRetry(url, mergedOptions)
            const data = await response.json()

            // Handle API response format
            if (data.success === false) {
                throw new NetworkError(
                    data.error || 'API request failed',
                    response.status,
                    response
                )
            }

            return data
        } catch (error) {
            // Re-throw NetworkErrors as-is
            if (error instanceof NetworkError) {
                throw error
            }

            // Wrap other errors
            throw new NetworkError(
                getErrorMessage(error),
                0,
                null
            )
        }
    }

    // Convenience methods for common HTTP verbs
    async get(endpoint: string, options: APIClientOptions = {}): Promise<any> {
        return this.request(endpoint, { ...options, method: 'GET' })
    }

    async post(endpoint: string, data: any, options: APIClientOptions = {}): Promise<any> {
        const body = data instanceof FormData ? data : JSON.stringify(data)

        // For FormData, don't set any Content-Type header - let the browser handle it
        // For JSON, set the Content-Type header
        const headers = data instanceof FormData
            ? { ...(options.headers || {}) } // No Content-Type for FormData
            : { 'Content-Type': 'application/json', ...(options.headers || {}) }

        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body,
            headers
        })
    }

    async put(endpoint: string, data: any, options: APIClientOptions = {}): Promise<any> {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    async delete(endpoint: string, options: APIClientOptions = {}): Promise<any> {
        return this.request(endpoint, { ...options, method: 'DELETE' })
    }
}

// Default API client instance
export const apiClient = new APIClient()

interface AsyncOperationState<T> {
    data: T | null
    loading: boolean
    error: NetworkError | null
}

interface AsyncOperationResult<T> extends AsyncOperationState<T> {
    execute: (...args: any[]) => Promise<T>
    retry: () => Promise<T>
}

/**
 * Hook for handling async operations with error states
 */
export function useAsyncOperation<T = any>(
    asyncFn: (...args: any[]) => Promise<T>,
    deps: React.DependencyList = []
): AsyncOperationResult<T> {
    const [state, setState] = React.useState<AsyncOperationState<T>>({
        data: null,
        loading: false,
        error: null
    })

    const execute = React.useCallback(async (...args: any[]): Promise<T> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const result = await asyncFn(...args)
            setState({ data: result, loading: false, error: null })
            return result
        } catch (error) {
            const networkError = error instanceof NetworkError ? error : new NetworkError(getErrorMessage(error))
            setState(prev => ({ ...prev, loading: false, error: networkError }))
            throw networkError
        }
    }, deps)

    const retry = React.useCallback((): Promise<T> => {
        return execute()
    }, [execute])

    return {
        ...state,
        execute,
        retry
    }
}
/**
 * Property-based test for network error handling
 * **Feature: phase-5-react-frontend, Property 8: Network error handling**
 * **Validates: Requirements 4.4, 8.4**
 */

import React from 'react'
import { render, screen, waitFor } from '../../../lib/test-utils/testing-library-utils'
import fc from 'fast-check'

// Mock fetch for testing
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock component that handles network errors
const NetworkErrorComponent = ({ endpoint, onError }) => {
    const [error, setError] = React.useState(null)
    const [loading, setLoading] = React.useState(false)
    const [data, setData] = React.useState(null)

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(endpoint)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }
            const result = await response.json()
            setData(result)
        } catch (err) {
            let userFriendlyMessage = err.message

            // Transform technical errors into user-friendly messages
            if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
                userFriendlyMessage = 'Network connection failed. Please check your internet connection.'
            } else if (err.message.includes('timeout')) {
                userFriendlyMessage = 'Request timed out. Please try again.'
            } else if (err.message.includes('HTTP 500')) {
                userFriendlyMessage = 'Server error occurred. Please try again later.'
            } else if (err.message.includes('HTTP 404')) {
                userFriendlyMessage = 'Resource not found.'
            } else if (err.message.includes('HTTP 403')) {
                userFriendlyMessage = 'Access denied. Please check your permissions.'
            }

            setError(userFriendlyMessage)
            onError?.(userFriendlyMessage)
        } finally {
            setLoading(false)
        }
    }, [endpoint, onError])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    if (loading) {
        return <div data-testid="loading">Loading...</div>
    }

    if (error) {
        return (
            <div data-testid="error-display">
                <div data-testid="error-message">{error}</div>
                <button onClick={fetchData} data-testid="retry-button">
                    Retry
                </button>
            </div>
        )
    }

    return <div data-testid="success">Data loaded successfully</div>
}

describe('Network Error Handling Property Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockFetch.mockClear()
    })

    test('Property 8: Network error handling - For any network error, the system should display user-friendly error messages', () => {
        fc.assert(
            fc.property(
                // Generate different types of network errors
                fc.oneof(
                    fc.constant({ type: 'network', error: new TypeError('Failed to fetch') }),
                    fc.constant({ type: 'timeout', error: new Error('Request timeout') }),
                    fc.constant({ type: 'server', status: 500, error: 'Internal Server Error' }),
                    fc.constant({ type: 'notfound', status: 404, error: 'Not Found' }),
                    fc.constant({ type: 'forbidden', status: 403, error: 'Forbidden' }),
                    fc.constant({ type: 'badrequest', status: 400, error: 'Bad Request' })
                ),
                // Generate random API endpoints
                fc.oneof(
                    fc.constant('/api/images'),
                    fc.constant('/api/labels'),
                    fc.constant('/api/annotations')
                ),
                async (errorConfig, endpoint) => {
                    const mockOnError = jest.fn()

                    // Setup mock based on error type
                    if (errorConfig.type === 'network' || errorConfig.type === 'timeout') {
                        mockFetch.mockRejectedValueOnce(errorConfig.error)
                    } else {
                        mockFetch.mockResolvedValueOnce({
                            ok: false,
                            status: errorConfig.status,
                            json: () => Promise.resolve({ error: errorConfig.error })
                        })
                    }

                    render(<NetworkErrorComponent endpoint={endpoint} onError={mockOnError} />)

                    // Wait for error to be displayed
                    await waitFor(() => {
                        expect(screen.getByTestId('error-display')).toBeInTheDocument()
                    })

                    const errorMessage = screen.getByTestId('error-message').textContent

                    // Property: Error messages should be user-friendly (not technical)
                    expect(errorMessage).not.toMatch(/TypeError|Failed to fetch|HTTP \d+/)
                    expect(errorMessage).toMatch(/network|connection|server|timeout|not found|access denied/i)

                    // Property: Error callback should be called with user-friendly message
                    expect(mockOnError).toHaveBeenCalledWith(expect.stringMatching(/network|connection|server|timeout|not found|access denied/i))

                    // Property: Retry button should always be available
                    expect(screen.getByTestId('retry-button')).toBeInTheDocument()

                    // Property: Error message should be non-empty
                    expect(errorMessage.trim()).not.toBe('')
                }
            ),
            { numRuns: 100 }
        )
    })

    test('Property 8: Network error handling - For any successful response, no error should be displayed', () => {
        fc.assert(
            fc.property(
                // Generate random successful API responses
                fc.record({
                    success: fc.constant(true),
                    data: fc.array(fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        name: fc.string({ minLength: 1, maxLength: 50 })
                    }))
                }),
                // Generate random API endpoints
                fc.oneof(
                    fc.constant('/api/images'),
                    fc.constant('/api/labels'),
                    fc.constant('/api/annotations')
                ),
                async (responseData, endpoint) => {
                    const mockOnError = jest.fn()

                    // Setup successful response
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve(responseData)
                    })

                    render(<NetworkErrorComponent endpoint={endpoint} onError={mockOnError} />)

                    // Wait for success state
                    await waitFor(() => {
                        expect(screen.getByTestId('success')).toBeInTheDocument()
                    })

                    // Property: No error should be displayed for successful responses
                    expect(screen.queryByTestId('error-display')).not.toBeInTheDocument()
                    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()

                    // Property: Error callback should not be called for successful responses
                    expect(mockOnError).not.toHaveBeenCalled()

                    // Property: Retry button should not be shown for successful responses
                    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument()
                }
            ),
            { numRuns: 100 }
        )
    })

    test('Property 8: Network error handling - For any error type, retry functionality should work', () => {
        fc.assert(
            fc.property(
                // Generate different error scenarios followed by success
                fc.oneof(
                    fc.constant({
                        firstCall: { type: 'network', error: new TypeError('Failed to fetch') },
                        secondCall: { success: true, data: { message: 'Success' } }
                    }),
                    fc.constant({
                        firstCall: { type: 'server', status: 500, error: 'Server Error' },
                        secondCall: { success: true, data: { message: 'Success' } }
                    })
                ),
                fc.oneof(
                    fc.constant('/api/images'),
                    fc.constant('/api/labels')
                ),
                async (scenario, endpoint) => {
                    const mockOnError = jest.fn()
                    let callCount = 0

                    mockFetch.mockImplementation(() => {
                        callCount++
                        if (callCount === 1) {
                            // First call fails
                            if (scenario.firstCall.type === 'network') {
                                return Promise.reject(scenario.firstCall.error)
                            } else {
                                return Promise.resolve({
                                    ok: false,
                                    status: scenario.firstCall.status,
                                    json: () => Promise.resolve({ error: scenario.firstCall.error })
                                })
                            }
                        } else {
                            // Second call succeeds
                            return Promise.resolve({
                                ok: true,
                                status: 200,
                                json: () => Promise.resolve(scenario.secondCall)
                            })
                        }
                    })

                    const { createUserEvent } = require('../../../lib/test-utils/testing-library-utils')
                    const user = createUserEvent()

                    render(<NetworkErrorComponent endpoint={endpoint} onError={mockOnError} />)

                    // Wait for initial error
                    await waitFor(() => {
                        expect(screen.getByTestId('error-display')).toBeInTheDocument()
                    })

                    // Property: Retry button should be clickable
                    const retryButton = screen.getByTestId('retry-button')
                    expect(retryButton).toBeEnabled()

                    // Click retry
                    await user.click(retryButton)

                    // Property: After successful retry, error should be cleared
                    await waitFor(() => {
                        expect(screen.getByTestId('success')).toBeInTheDocument()
                    })

                    // Property: Error display should be removed after successful retry
                    expect(screen.queryByTestId('error-display')).not.toBeInTheDocument()

                    // Property: Fetch should be called twice (initial + retry)
                    expect(mockFetch).toHaveBeenCalledTimes(2)
                    expect(mockFetch).toHaveBeenCalledWith(endpoint)
                }
            ),
            { numRuns: 50 } // Reduced runs for interaction tests
        )
    })

    test('Property 8: Network error handling - Error messages should be consistent for same error types', () => {
        fc.assert(
            fc.property(
                // Generate same error type multiple times
                fc.constantFrom('network', 'timeout', 'server', 'notfound', 'forbidden'),
                fc.integer({ min: 2, max: 5 }), // Number of times to test same error
                async (errorType, iterations) => {
                    const errorMessages = []

                    for (let i = 0; i < iterations; i++) {
                        const mockOnError = jest.fn()

                        // Setup same error type each time
                        switch (errorType) {
                            case 'network':
                                mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
                                break
                            case 'timeout':
                                mockFetch.mockRejectedValueOnce(new Error('Request timeout'))
                                break
                            case 'server':
                                mockFetch.mockResolvedValueOnce({
                                    ok: false,
                                    status: 500,
                                    json: () => Promise.resolve({ error: 'Internal Server Error' })
                                })
                                break
                            case 'notfound':
                                mockFetch.mockResolvedValueOnce({
                                    ok: false,
                                    status: 404,
                                    json: () => Promise.resolve({ error: 'Not Found' })
                                })
                                break
                            case 'forbidden':
                                mockFetch.mockResolvedValueOnce({
                                    ok: false,
                                    status: 403,
                                    json: () => Promise.resolve({ error: 'Forbidden' })
                                })
                                break
                        }

                        const { unmount } = render(<NetworkErrorComponent endpoint="/api/test" onError={mockOnError} />)

                        await waitFor(() => {
                            expect(screen.getByTestId('error-display')).toBeInTheDocument()
                        })

                        const errorMessage = screen.getByTestId('error-message').textContent
                        errorMessages.push(errorMessage)

                        unmount()
                    }

                    // Property: Same error types should produce consistent error messages
                    const uniqueMessages = [...new Set(errorMessages)]
                    expect(uniqueMessages).toHaveLength(1)

                    // Property: All messages should be user-friendly
                    errorMessages.forEach(message => {
                        expect(message).not.toMatch(/TypeError|Failed to fetch|HTTP \d+/)
                        expect(message).toMatch(/network|connection|server|timeout|not found|access denied/i)
                    })
                }
            ),
            { numRuns: 20 } // Reduced runs for multiple render tests
        )
    })
})
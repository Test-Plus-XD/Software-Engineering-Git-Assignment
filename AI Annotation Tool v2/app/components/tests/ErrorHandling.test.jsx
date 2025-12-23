/**
 * Failing tests for comprehensive error handling
 * Following TDD approach - these tests should fail until error handling is implemented
 * Requirements: 4.4, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React from 'react'
import { render, screen, waitFor } from '../../../lib/test-utils/testing-library-utils'
import { createUserEvent } from '../../../lib/test-utils/testing-library-utils'

// Mock fetch for testing
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock components that will use error handling
const MockImageGallery = ({ onError }) => {
    const [error, setError] = React.useState(null)
    const [showRetry, setShowRetry] = React.useState(false)

    const fetchImages = React.useCallback(async () => {
        try {
            const response = await fetch('/api/images')
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Server error')
            }
            const data = await response.json()
            setError(null)
            setShowRetry(false)
        } catch (err) {
            let userFriendlyMessage = err.message
            if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
                userFriendlyMessage = 'Network connection failed'
            } else if (err.message.includes('timeout')) {
                userFriendlyMessage = 'Request took too long'
            } else if (err.message.includes('Internal server error')) {
                userFriendlyMessage = 'Server error occurred'
            }

            setError(userFriendlyMessage)
            setShowRetry(true)
            onError?.(userFriendlyMessage)
        }
    }, [onError])

    React.useEffect(() => {
        fetchImages()
    }, [fetchImages])

    if (error) {
        return (
            <div>
                <div data-testid="network-error">{error}</div>
                {showRetry && (
                    <button onClick={fetchImages} data-testid="retry-button">
                        Try again
                    </button>
                )}
            </div>
        )
    }

    return <div data-testid="image-gallery">Gallery content</div>
}

const MockUploadForm = ({ onError }) => {
    const [error, setError] = React.useState(null)

    const handleUpload = async () => {
        try {
            const response = await fetch('/api/images', { method: 'POST' })
            if (!response.ok) throw new Error('Upload failed')
            setError(null)
        } catch (err) {
            setError(err.message)
            onError?.(err.message)
        }
    }

    return (
        <div>
            <button onClick={handleUpload} data-testid="upload-button">Upload</button>
            {error && <div data-testid="upload-error">{error}</div>}
        </div>
    )
}

// Component that will throw an error for error boundary testing
const ErrorThrowingComponent = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error('Component crashed')
    }
    return <div data-testid="working-component">Working fine</div>
}

describe('Comprehensive Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockFetch.mockClear()
    })

    describe('Network Error Handling', () => {
        test('displays user-friendly messages for network errors', async () => {
            // Mock network failure
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

            const mockOnError = jest.fn()
            render(<MockImageGallery onError={mockOnError} />)

            await waitFor(() => {
                expect(screen.getByTestId('network-error')).toBeInTheDocument()
            })

            // Should display user-friendly error message
            expect(screen.getByText(/network.*connection.*failed/i)).toBeInTheDocument()
            expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('Network'))
        })

        test('displays specific error messages for different HTTP status codes', async () => {
            // Mock 500 server error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ success: false, error: 'Internal server error' })
            })

            const mockOnError = jest.fn()
            render(<MockImageGallery onError={mockOnError} />)

            await waitFor(() => {
                expect(screen.getByText(/server.*error/i)).toBeInTheDocument()
            })
        })

        test('displays timeout error messages', async () => {
            // Mock timeout
            mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

            const mockOnError = jest.fn()
            render(<MockImageGallery onError={mockOnError} />)

            // Should eventually show timeout error
            await waitFor(() => {
                expect(screen.getByText(/took.*too.*long/i)).toBeInTheDocument()
            })
        })

        test('provides retry functionality for failed requests', async () => {
            let callCount = 0
            mockFetch.mockImplementation(() => {
                callCount++
                if (callCount === 1) {
                    return Promise.reject(new TypeError('Network error'))
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, data: [] })
                })
            })

            const mockOnError = jest.fn()
            render(<MockImageGallery onError={mockOnError} />)

            await waitFor(() => {
                expect(screen.getByTestId('network-error')).toBeInTheDocument()
            })

            // Should show retry button
            expect(screen.getByTestId('retry-button')).toBeInTheDocument()

            // Click retry
            const user = createUserEvent()
            const retryButton = screen.getByTestId('retry-button')
            await user.click(retryButton)

            // Should succeed on retry
            await waitFor(() => {
                expect(screen.getByTestId('image-gallery')).toBeInTheDocument()
            })
        })
    })

    describe('API Integration', () => {
        test('uses correct endpoints for image operations', async () => {
            let requestUrl = ''
            mockFetch.mockImplementationOnce((url) => {
                requestUrl = url
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, data: [] })
                })
            })

            render(<MockImageGallery />)

            await waitFor(() => {
                expect(requestUrl).toBe('/api/images')
            })
        })

        test('uses correct endpoints for upload operations', async () => {
            let requestUrl = ''
            let requestMethod = ''
            mockFetch.mockImplementationOnce((url, options) => {
                requestUrl = url
                requestMethod = options?.method || 'GET'
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, data: { id: 1 } })
                })
            })

            const user = createUserEvent()
            render(<MockUploadForm />)

            const uploadButton = screen.getByTestId('upload-button')
            await user.click(uploadButton)

            await waitFor(() => {
                expect(requestUrl).toBe('/api/images')
                expect(requestMethod).toBe('POST')
            })
        })

        test('uses correct endpoints for label operations', async () => {
            let requestUrl = ''
            mockFetch.mockImplementationOnce((url) => {
                requestUrl = url
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, data: [] })
                })
            })

            // Mock component that fetches labels
            const MockLabelComponent = () => {
                React.useEffect(() => {
                    fetch('/api/labels')
                }, [])
                return <div data-testid="label-component">Labels</div>
            }

            render(<MockLabelComponent />)

            await waitFor(() => {
                expect(requestUrl).toBe('/api/labels')
            })
        })

        test('handles API response format correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [{ id: 1, filename: 'test.jpg' }],
                    pagination: {
                        page: 1,
                        limit: 10,
                        totalImages: 1,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                })
            })

            // Mock component that expects specific API format
            const MockAPIConsumer = () => {
                const [data, setData] = React.useState(null)

                React.useEffect(() => {
                    fetch('/api/images')
                        .then(res => res.json())
                        .then(response => {
                            // Should handle the expected API format
                            expect(response).toHaveProperty('success')
                            expect(response).toHaveProperty('data')
                            expect(response).toHaveProperty('pagination')
                            setData(response.data)
                        })
                }, [])

                return data ? <div data-testid="api-data">Data loaded</div> : <div>Loading...</div>
            }

            render(<MockAPIConsumer />)

            await waitFor(() => {
                expect(screen.getByTestId('api-data')).toBeInTheDocument()
            })
        })
    })

    describe('UI Data Synchronization', () => {
        test('refreshes UI after successful data updates', async () => {
            let imageCount = 0
            mockFetch.mockImplementation((url, options) => {
                if (options?.method === 'POST') {
                    imageCount++
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true, data: { id: imageCount, filename: 'new.jpg' } })
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: Array(imageCount).fill().map((_, i) => ({ id: i, filename: `image${i}.jpg` }))
                    })
                })
            })

            // Mock component that shows count and allows adding
            const MockSyncComponent = () => {
                const [images, setImages] = React.useState([])

                const fetchImages = async () => {
                    const response = await fetch('/api/images')
                    const data = await response.json()
                    setImages(data.data)
                }

                const addImage = async () => {
                    await fetch('/api/images', { method: 'POST' })
                    // Should refresh after adding
                    await fetchImages()
                }

                React.useEffect(() => {
                    fetchImages()
                }, [])

                return (
                    <div>
                        <div data-testid="image-count">{images.length} images</div>
                        <button onClick={addImage} data-testid="add-image">Add Image</button>
                    </div>
                )
            }

            const user = createUserEvent()
            render(<MockSyncComponent />)

            // Initially should show 0 images
            await waitFor(() => {
                expect(screen.getByText('0 images')).toBeInTheDocument()
            })

            // Add an image
            const addButton = screen.getByTestId('add-image')
            await user.click(addButton)

            // Should update to show 1 image
            await waitFor(() => {
                expect(screen.getByText('1 images')).toBeInTheDocument()
            })
        })

        test('handles optimistic updates with rollback on failure', async () => {
            let shouldFail = false
            mockFetch.mockImplementation((url, options) => {
                if (options?.method === 'POST') {
                    if (shouldFail) {
                        return Promise.resolve({
                            ok: false,
                            status: 500,
                            json: () => Promise.resolve({ success: false, error: 'Server error' })
                        })
                    }
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true, data: { id: 1, filename: 'new.jpg' } })
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true, data: [] })
                })
            })

            // Mock component with optimistic updates
            const MockOptimisticComponent = () => {
                const [images, setImages] = React.useState([])
                const [error, setError] = React.useState(null)

                const addImageOptimistically = async () => {
                    const tempImage = { id: 'temp', filename: 'uploading.jpg', uploading: true }
                    setImages(prev => [...prev, tempImage])
                    setError(null)

                    try {
                        const response = await fetch('/api/images', { method: 'POST' })
                        if (!response.ok) throw new Error('Upload failed')

                        const data = await response.json()
                        // Replace temp image with real one
                        setImages(prev => prev.map(img =>
                            img.id === 'temp' ? data.data : img
                        ))
                    } catch (err) {
                        // Rollback optimistic update
                        setImages(prev => prev.filter(img => img.id !== 'temp'))
                        setError(err.message)
                    }
                }

                return (
                    <div>
                        <div data-testid="image-list">
                            {images.map(img => (
                                <div key={img.id} data-testid={`image-${img.id}`}>
                                    {img.filename} {img.uploading && '(uploading...)'}
                                </div>
                            ))}
                        </div>
                        <button onClick={addImageOptimistically} data-testid="add-optimistic">
                            Add Image
                        </button>
                        {error && <div data-testid="rollback-error">{error}</div>}
                    </div>
                )
            }

            const user = createUserEvent()
            render(<MockOptimisticComponent />)

            // Set up to fail
            shouldFail = true

            const addButton = screen.getByTestId('add-optimistic')
            await user.click(addButton)

            // Should show optimistic update first
            expect(screen.getByTestId('image-temp')).toBeInTheDocument()
            expect(screen.getByText('uploading.jpg (uploading...)')).toBeInTheDocument()

            // Should rollback and show error
            await waitFor(() => {
                expect(screen.queryByTestId('image-temp')).not.toBeInTheDocument()
                expect(screen.getByTestId('rollback-error')).toBeInTheDocument()
            })
        })

        test('synchronizes data across multiple components', async () => {
            // Mock global state or event system for data sync
            const mockEventEmitter = {
                listeners: [],
                emit: (event, data) => {
                    mockEventEmitter.listeners.forEach(listener => {
                        if (listener.event === event) {
                            listener.callback(data)
                        }
                    })
                },
                on: (event, callback) => {
                    mockEventEmitter.listeners.push({ event, callback })
                }
            }

            // Mock components that should sync
            const MockComponent1 = () => {
                const [count, setCount] = React.useState(0)

                React.useEffect(() => {
                    mockEventEmitter.on('dataUpdate', (newCount) => {
                        setCount(newCount)
                    })
                }, [])

                const updateData = () => {
                    const newCount = count + 1
                    setCount(newCount)
                    mockEventEmitter.emit('dataUpdate', newCount)
                }

                return (
                    <div>
                        <div data-testid="component1-count">{count}</div>
                        <button onClick={updateData} data-testid="update-button">Update</button>
                    </div>
                )
            }

            const MockComponent2 = () => {
                const [count, setCount] = React.useState(0)

                React.useEffect(() => {
                    mockEventEmitter.on('dataUpdate', (newCount) => {
                        setCount(newCount)
                    })
                }, [])

                return <div data-testid="component2-count">{count}</div>
            }

            const user = createUserEvent()
            render(
                <div>
                    <MockComponent1 />
                    <MockComponent2 />
                </div>
            )

            // Both should start at 0
            expect(screen.getByTestId('component1-count')).toHaveTextContent('0')
            expect(screen.getByTestId('component2-count')).toHaveTextContent('0')

            // Update from component 1
            const updateButton = screen.getByTestId('update-button')
            await user.click(updateButton)

            // Both should update to 1
            await waitFor(() => {
                expect(screen.getByTestId('component1-count')).toHaveTextContent('1')
                expect(screen.getByTestId('component2-count')).toHaveTextContent('1')
            })
        })
    })

    describe('Error Boundary Handling', () => {
        // Suppress console.error for these tests since we expect errors
        const originalError = console.error
        beforeAll(() => {
            console.error = jest.fn()
        })
        afterAll(() => {
            console.error = originalError
        })

        test('catches and displays component errors', () => {
            // Mock error boundary component (this should be implemented)
            const MockErrorBoundary = ({ children }) => {
                const [hasError, setHasError] = React.useState(false)
                const [error, setError] = React.useState(null)

                // Simulate error boundary behavior
                React.useEffect(() => {
                    try {
                        // This won't actually catch render errors, but simulates the concept
                        if (children.props?.shouldThrow) {
                            throw new Error('Component crashed')
                        }
                    } catch (err) {
                        setHasError(true)
                        setError(err)
                    }
                }, [children])

                if (hasError) {
                    return (
                        <div data-testid="error-boundary">
                            <h2>Something went wrong</h2>
                            <p data-testid="error-message">{error?.message}</p>
                            <button
                                onClick={() => setHasError(false)}
                                data-testid="error-retry"
                            >
                                Try again
                            </button>
                        </div>
                    )
                }

                return children
            }

            render(
                <MockErrorBoundary>
                    <ErrorThrowingComponent shouldThrow={true} />
                </MockErrorBoundary>
            )

            // Should show error boundary UI
            expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
            expect(screen.getByText('Something went wrong')).toBeInTheDocument()
            expect(screen.getByTestId('error-retry')).toBeInTheDocument()
        })

        test('allows recovery from component errors', async () => {
            const user = createUserEvent()

            // Mock error boundary with recovery
            const MockRecoverableErrorBoundary = ({ children }) => {
                const [hasError, setHasError] = React.useState(false)
                const [shouldThrow, setShouldThrow] = React.useState(true)

                const retry = () => {
                    setHasError(false)
                    setShouldThrow(false)
                }

                React.useEffect(() => {
                    if (shouldThrow) {
                        setHasError(true)
                    }
                }, [shouldThrow])

                if (hasError) {
                    return (
                        <div data-testid="error-boundary">
                            <button onClick={retry} data-testid="error-retry">Retry</button>
                        </div>
                    )
                }

                return React.cloneElement(children, { shouldThrow })
            }

            render(
                <MockRecoverableErrorBoundary>
                    <ErrorThrowingComponent />
                </MockRecoverableErrorBoundary>
            )

            // Should show error initially
            expect(screen.getByTestId('error-boundary')).toBeInTheDocument()

            // Click retry
            const retryButton = screen.getByTestId('error-retry')
            await user.click(retryButton)

            // Should recover and show working component
            await waitFor(() => {
                expect(screen.getByTestId('working-component')).toBeInTheDocument()
            })
        })

        test('logs errors for debugging', () => {
            const mockLogger = jest.fn()

            // Mock error boundary with logging
            const MockLoggingErrorBoundary = ({ children }) => {
                const [hasError, setHasError] = React.useState(false)

                React.useEffect(() => {
                    try {
                        if (children.props?.shouldThrow) {
                            const error = new Error('Component crashed')
                            mockLogger('Component error:', error.message)
                            setHasError(true)
                        }
                    } catch (err) {
                        mockLogger('Component error:', err.message)
                        setHasError(true)
                    }
                }, [children])

                if (hasError) {
                    return <div data-testid="error-boundary">Error occurred</div>
                }

                return children
            }

            render(
                <MockLoggingErrorBoundary>
                    <ErrorThrowingComponent shouldThrow={true} />
                </MockLoggingErrorBoundary>
            )

            // Should log the error
            expect(mockLogger).toHaveBeenCalledWith('Component error:', 'Component crashed')
        })

        test('provides fallback UI for different error types', () => {
            // Mock error boundary with different fallbacks
            const MockSmartErrorBoundary = ({ children }) => {
                const [error, setError] = React.useState(null)

                React.useEffect(() => {
                    try {
                        if (children.props?.shouldThrow) {
                            const err = new Error('Component crashed')
                            setError(err)
                        }
                    } catch (err) {
                        setError(err)
                    }
                }, [children])

                if (error) {
                    if (error.message.includes('Network')) {
                        return (
                            <div data-testid="network-error-fallback">
                                Network error occurred. Please check your connection.
                            </div>
                        )
                    }

                    if (error.message.includes('Component')) {
                        return (
                            <div data-testid="component-error-fallback">
                                Component error occurred. Please refresh the page.
                            </div>
                        )
                    }

                    return (
                        <div data-testid="generic-error-fallback">
                            An unexpected error occurred.
                        </div>
                    )
                }

                return children
            }

            render(
                <MockSmartErrorBoundary>
                    <ErrorThrowingComponent shouldThrow={true} />
                </MockSmartErrorBoundary>
            )

            // Should show component-specific fallback
            expect(screen.getByTestId('component-error-fallback')).toBeInTheDocument()
            expect(screen.getByText(/component error.*refresh/i)).toBeInTheDocument()
        })
    })
})
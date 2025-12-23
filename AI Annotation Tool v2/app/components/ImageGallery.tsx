'use client'

import { useState, useEffect } from 'react'
import ImageCard from './ImageCard'
import { apiClient, NetworkError } from '../../lib/utils/network-error-handler'
import { useAutoRefresh, DATA_SYNC_EVENTS } from '../../lib/utils/data-sync'

interface Image {
    image_id: number
    filename: string
    file_path: string
    file_size: number
    mime_type: string
    upload_date: string
    labels: string[]
    confidences?: number[]
    label_count?: number
}

interface Pagination {
    page: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

interface ImageGalleryProps {
    page?: number
    limit?: number
    searchQuery?: string
    selectedLabel?: string
    // Allow passing data directly for testing
    images?: Image[] | null
    pagination?: Pagination | null
    error?: string | null
    loading?: boolean | null
}

/**
 * ImageGallery Component
 * Displays a responsive grid of images with pagination support
 * Handles both server-side data fetching and client-side props
 */
export default function ImageGallery({
    page = 1,
    limit = 10,
    searchQuery = '',
    selectedLabel = '',
    // Allow passing data directly for testing
    images: propImages = null,
    pagination: propPagination = null,
    error: propError = null,
    loading: propLoading = null
}: ImageGalleryProps) {
    const [images, setImages] = useState<Image[] | null>(propImages)
    const [pagination, setPagination] = useState<Pagination | null>(propPagination)
    const [error, setError] = useState<string | null>(propError)
    const [loading, setLoading] = useState<boolean>(propLoading !== null ? propLoading : (propImages === null && propError === null))
    const [retryCount, setRetryCount] = useState(0)

    // Auto-refresh when data changes
    useAutoRefresh(
        () => {
            if (propImages === null && propError === null && propLoading === null) {
                fetchImages()
            }
        },
        [DATA_SYNC_EVENTS.IMAGES_REFRESHED, DATA_SYNC_EVENTS.IMAGE_ADDED],
        { enabled: process.env.NODE_ENV !== 'test' }
    )

    // Fetch data when component mounts or parameters change
    const fetchImages = async () => {
        try {
            setLoading(true)
            setError(null)

            // Construct query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            })

            if (searchQuery) {
                params.set('search', searchQuery)
            }
            if (selectedLabel) {
                params.set('label', selectedLabel)
            }

            // Use API client with built-in error handling and retry logic
            const data = await apiClient.get(`/api/images?${params.toString()}`)

            if (data.success) {
                setImages(data.data || [])
                setPagination(data.pagination)
                setRetryCount(0) // Reset retry count on success
            } else {
                throw new NetworkError(data.error || 'Failed to fetch images')
            }
        } catch (err: any) {
            console.error('Error fetching images:', err)

            // Set user-friendly error message
            const errorMessage = err instanceof NetworkError
                ? err.userFriendlyMessage
                : 'Failed to load images. Please try again.'

            setError(errorMessage)
            setRetryCount(prev => prev + 1)
        } finally {
            setLoading(false)
        }
    }

    // Fetch data when component mounts or parameters change
    useEffect(() => {
        // Skip fetching if data is provided via props (testing scenario)
        if (propImages !== null || propError !== null || propLoading !== null) {
            setImages(propImages)
            setPagination(propPagination)
            setError(propError)
            setLoading(propLoading !== null ? propLoading : false)
            return
        }

        // Skip fetching in test environment to avoid network calls
        if (process.env.NODE_ENV === 'test') {
            setLoading(false)
            return
        }

        fetchImages()
    }, [page, limit, searchQuery, selectedLabel, propImages, propPagination, propError, propLoading])

    // Retry function for error recovery
    const handleRetry = () => {
        fetchImages()
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading</h3>
                    <p className="text-gray-500">Fetching your images...</p>
                </div>
            </div>
        )
    }

    // Error state with retry functionality
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center max-w-md">
                    <svg
                        className="mx-auto h-16 w-16 text-red-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Images</h3>
                    <p className="text-gray-500 mb-4">{error}</p>
                    {retryCount > 0 && (
                        <p className="text-sm text-gray-400 mb-4">
                            Retry attempt: {retryCount}
                        </p>
                    )}
                    <div className="space-y-2">
                        <button
                            onClick={handleRetry}
                            disabled={loading}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                            data-testid="retry-button"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Retrying...
                                </>
                            ) : (
                                'Try Again'
                            )}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Empty state
    if (!images || images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Found</h3>
                    <p className="text-gray-500">
                        {searchQuery || selectedLabel
                            ? 'Try adjusting your search criteria or upload some images to get started.'
                            : 'Upload some images to get started with your annotation project.'
                        }
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Image Grid */}
            <div
                data-testid="image-gallery-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-300 ease-in-out"
            >
                {images.map((image) => (
                    <ImageCard
                        key={image.image_id}
                        image={{
                            ...image,
                            labels: image.labels || [],
                            original_name: image.filename
                        }}
                        onLabelClick={(label: string) => {
                            // Handle label click - could be used for filtering
                            console.log('Label clicked:', label)
                        }}
                        className="mx-auto"
                    />
                ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 py-6">
                    <PaginationButton
                        href={`?page=${pagination.page - 1}&limit=${limit}${searchQuery ? `&search=${searchQuery}` : ''}${selectedLabel ? `&label=${selectedLabel}` : ''}`}
                        disabled={!pagination.hasPrevPage}
                        direction="previous"
                    >
                        Previous
                    </PaginationButton>

                    <span className="text-sm text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>

                    <PaginationButton
                        href={`?page=${pagination.page + 1}&limit=${limit}${searchQuery ? `&search=${searchQuery}` : ''}${selectedLabel ? `&label=${selectedLabel}` : ''}`}
                        disabled={!pagination.hasNextPage}
                        direction="next"
                    >
                        Next
                    </PaginationButton>
                </div>
            )}
        </div>
    )
}

interface PaginationButtonProps {
    href: string
    disabled: boolean
    children: React.ReactNode
    direction: string
}

/**
 * Pagination Button Component
 * Handles navigation between pages
 */
function PaginationButton({ href, disabled, children, direction }: PaginationButtonProps) {
    if (disabled) {
        return (
            <button
                disabled
                className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed min-h-[44px] min-w-[44px] touch-manipulation"
                role="button"
                aria-label={direction}
            >
                {children}
            </button>
        )
    }

    return (
        <a
            href={href}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] touch-manipulation inline-flex items-center justify-center"
            role="button"
            aria-label={direction}
        >
            {children}
        </a>
    )
}
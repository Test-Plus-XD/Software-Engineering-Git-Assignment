'use client'

import { useState, useEffect } from 'react'
import ImageCard from './ImageCard'

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
}) {
    const [images, setImages] = useState(propImages)
    const [pagination, setPagination] = useState(propPagination)
    const [error, setError] = useState(propError)
    const [loading, setLoading] = useState(propLoading !== null ? propLoading : (propImages === null && propError === null))

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

        const fetchImages = async () => {
            try {
                setLoading(true)
                setError(null)

                // Construct API URL with query parameters
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                const url = new URL(`${baseUrl}/api/images`)
                url.searchParams.set('page', page.toString())
                url.searchParams.set('limit', limit.toString())

                if (searchQuery) {
                    url.searchParams.set('search', searchQuery)
                }
                if (selectedLabel) {
                    url.searchParams.set('label', selectedLabel)
                }

                // Fetch images from API
                const response = await fetch(url.toString(), {
                    cache: 'no-store' // Ensure fresh data on each request
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch images: ${response.status}`)
                }

                const data = await response.json()

                if (data.success) {
                    setImages(data.data || [])
                    setPagination(data.pagination)
                } else {
                    throw new Error(data.error || 'Failed to fetch images')
                }
            } catch (err) {
                console.error('Error fetching images:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchImages()
    }, [page, limit, searchQuery, selectedLabel, propImages, propPagination, propError, propLoading])

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

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center">
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
                    <p className="text-gray-500">{error}</p>
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
                        image={image}
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

/**
 * Pagination Button Component
 * Handles navigation between pages
 */
function PaginationButton({ href, disabled, children, direction }) {
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
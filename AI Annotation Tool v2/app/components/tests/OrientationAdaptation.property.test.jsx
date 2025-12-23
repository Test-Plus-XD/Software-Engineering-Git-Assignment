/**
 * Property-based tests for screen orientation adaptation
 * **Feature: phase-5-react-frontend, Property 11: Screen orientation adaptation**
 * **Validates: Requirements 6.4**
 */

import { render, screen, cleanup, fireEvent, waitFor } from '../../../lib/test-utils/testing-library-utils'
import { setViewport } from '../../../lib/test-utils/testing-library-utils'
import fc from 'fast-check'
import ImageGallery from '../ImageGallery'
import ImageCard from '../ImageCard'
import UploadForm from '../UploadForm'
import LabelSelector from '../LabelSelector'

// Mock Next.js Image component
jest.mock('next/image', () => {
    return function MockImage({ src, alt, onLoad, onError, ...props }) {
        return (
            <img
                src={src}
                alt={alt}
                onLoad={onLoad}
                onError={onError}
                data-testid="image"
                {...props}
            />
        )
    }
})

describe('Screen Orientation Adaptation Properties', () => {
    afterEach(() => {
        cleanup()
    })

    /**
     * Property 11: Screen orientation adaptation
     * For any screen orientation change, the system should adapt the layout appropriately
     * **Validates: Requirements 6.4**
     */
    test('Property 11: Screen orientation adaptation', () => {
        fc.assert(
            fc.property(
                // Generate random image data for testing
                fc.array(
                    fc.record({
                        image_id: fc.integer({ min: 1, max: 1000 }),
                        filename: fc.string({ minLength: 5, maxLength: 20 }).map(s => s + '.jpg'),
                        original_name: fc.string({ minLength: 5, maxLength: 20 }).map(s => s + '.jpg'),
                        file_path: fc.webUrl(),
                        file_size: fc.integer({ min: 1024, max: 10485760 }),
                        mime_type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
                        uploaded_at: fc.date().map(d => d.toISOString()),
                        labels: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { maxLength: 3 }),
                        confidences: fc.array(fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }), { maxLength: 3 }),
                        label_count: fc.integer({ min: 0, max: 3 })
                    }),
                    { minLength: 1, maxLength: 4 } // Keep small for performance
                ),
                // Generate orientation pairs (portrait -> landscape or vice versa)
                fc.record({
                    initialWidth: fc.integer({ min: 320, max: 1024 }),
                    initialHeight: fc.integer({ min: 480, max: 1366 }),
                    shouldFlip: fc.boolean() // Whether to flip dimensions for orientation change
                }),
                (images, orientationData) => {
                    // Ensure unique image_ids and consistent label/confidence arrays
                    const normalizedImages = images.map((image, index) => ({
                        ...image,
                        image_id: index + 1,
                        labels: image.labels.slice(0, image.label_count),
                        confidences: image.confidences.slice(0, image.label_count)
                    }))

                    const mockProps = {
                        images: normalizedImages,
                        pagination: {
                            page: 1,
                            limit: 10,
                            totalImages: normalizedImages.length,
                            totalPages: Math.ceil(normalizedImages.length / 10),
                            hasNextPage: normalizedImages.length > 10,
                            hasPrevPage: false
                        }
                    }

                    // Set initial orientation
                    const initialWidth = orientationData.initialWidth
                    const initialHeight = orientationData.initialHeight
                    setViewport(initialWidth, initialHeight)

                    const { rerender, unmount } = render(<ImageGallery {...mockProps} />)

                    try {
                        // Capture initial layout state
                        const initialGrid = screen.getByTestId('image-gallery-grid')
                        const initialClasses = initialGrid.className

                        // Determine expected grid columns based on initial viewport
                        let expectedInitialColumns
                        if (initialWidth >= 1024) {
                            expectedInitialColumns = 'lg:grid-cols-3'
                        } else if (initialWidth >= 768) {
                            expectedInitialColumns = 'md:grid-cols-2'
                        } else {
                            expectedInitialColumns = 'grid-cols-1'
                        }

                        // Verify initial layout has appropriate responsive classes
                        expect(initialClasses).toContain('grid')
                        expect(initialClasses).toContain('grid-cols-1') // Base mobile class
                        expect(initialClasses).toContain('md:grid-cols-2') // Tablet class
                        expect(initialClasses).toContain('lg:grid-cols-3') // Desktop class

                        // Change orientation
                        let newWidth, newHeight
                        if (orientationData.shouldFlip) {
                            // Flip dimensions (portrait <-> landscape)
                            newWidth = initialHeight
                            newHeight = initialWidth
                        } else {
                            // Change to different size in same orientation
                            if (initialWidth > initialHeight) {
                                // Landscape -> different landscape
                                newWidth = initialWidth > 768 ? 768 : 1024
                                newHeight = initialHeight
                            } else {
                                // Portrait -> different portrait
                                newWidth = initialWidth
                                newHeight = initialHeight > 800 ? 600 : 1000
                            }
                        }

                        // Apply orientation change
                        setViewport(newWidth, newHeight)
                        fireEvent(window, new Event('orientationchange'))
                        rerender(<ImageGallery {...mockProps} />)

                        // Allow for layout updates (synchronous in test environment)
                        // In real environment, orientation changes trigger immediate re-renders

                        const updatedGrid = screen.getByTestId('image-gallery-grid')
                        const updatedClasses = updatedGrid.className

                        // Verify layout still has responsive classes after orientation change
                        expect(updatedClasses).toContain('grid')
                        expect(updatedClasses).toContain('grid-cols-1') // Base mobile class
                        expect(updatedClasses).toContain('md:grid-cols-2') // Tablet class
                        expect(updatedClasses).toContain('lg:grid-cols-3') // Desktop class

                        // Verify the grid adapts to new viewport dimensions
                        // The responsive classes should still be present and functional
                        const gridRect = updatedGrid.getBoundingClientRect()
                        expect(gridRect.width).toBeGreaterThan(0)
                        expect(gridRect.height).toBeGreaterThan(0)

                        // Test rapid orientation changes don't break the layout
                        for (let i = 0; i < 3; i++) {
                            const rapidWidth = i % 2 === 0 ? 375 : 768
                            const rapidHeight = i % 2 === 0 ? 667 : 1024

                            setViewport(rapidWidth, rapidHeight)
                            fireEvent(window, new Event('orientationchange'))
                            rerender(<ImageGallery {...mockProps} />)
                        }

                        // Verify layout is still functional after rapid changes
                        const finalGrid = screen.getByTestId('image-gallery-grid')
                        expect(finalGrid).toBeInTheDocument()
                        expect(finalGrid.className).toContain('grid')

                    } finally {
                        unmount()
                    }
                }
            ),
            { numRuns: 20 } // Reduced runs for performance while testing various scenarios
        )
    })

    /**
     * Property test for orientation change handling across different components
     */
    test('Property 11a: Component orientation resilience', () => {
        fc.assert(
            fc.property(
                // Generate orientation change scenarios
                fc.record({
                    startWidth: fc.integer({ min: 320, max: 1200 }),
                    startHeight: fc.integer({ min: 480, max: 800 }),
                    endWidth: fc.integer({ min: 320, max: 1200 }),
                    endHeight: fc.integer({ min: 480, max: 800 })
                }),
                (orientationChange) => {
                    // Test ImageCard orientation resilience
                    const mockImageData = {
                        image_id: 1,
                        filename: 'test.jpg',
                        original_name: 'test.jpg',
                        file_path: 'https://example.com/test.jpg',
                        file_size: 1024,
                        mime_type: 'image/jpeg',
                        uploaded_at: '2023-01-01T00:00:00Z',
                        labels: ['test'],
                        confidences: [0.95],
                        label_count: 1
                    }

                    // Start with initial orientation
                    setViewport(orientationChange.startWidth, orientationChange.startHeight)
                    const { rerender, unmount: unmountImageCard } = render(
                        <ImageCard image={mockImageData} />
                    )

                    try {
                        // Verify initial render
                        const initialCard = screen.getByTestId('image-card')
                        expect(initialCard).toBeInTheDocument()

                        // Change orientation
                        setViewport(orientationChange.endWidth, orientationChange.endHeight)
                        fireEvent(window, new Event('orientationchange'))
                        rerender(<ImageCard image={mockImageData} />)

                        // Verify component still renders correctly after orientation change
                        const updatedCard = screen.getByTestId('image-card')
                        expect(updatedCard).toBeInTheDocument()

                        // Should maintain responsive classes
                        const cardClasses = updatedCard.className
                        expect(cardClasses).toContain('w-full')
                        expect(cardClasses).toMatch(/max-w-(sm|md|lg)/)

                    } finally {
                        unmountImageCard()
                    }

                    // Test UploadForm orientation resilience
                    setViewport(orientationChange.startWidth, orientationChange.startHeight)
                    const { rerender: rerenderUpload, unmount: unmountUpload } = render(<UploadForm />)

                    try {
                        // Verify initial render
                        const initialDropZone = screen.getByTestId('drop-zone')
                        expect(initialDropZone).toBeInTheDocument()

                        // Change orientation
                        setViewport(orientationChange.endWidth, orientationChange.endHeight)
                        fireEvent(window, new Event('orientationchange'))
                        rerenderUpload(<UploadForm />)

                        // Verify component still renders correctly
                        const updatedDropZone = screen.getByTestId('drop-zone')
                        expect(updatedDropZone).toBeInTheDocument()

                    } finally {
                        unmountUpload()
                    }
                }
            ),
            { numRuns: 15 }
        )
    })

    /**
     * Property test for layout consistency during orientation transitions
     */
    test('Property 11b: Layout transition smoothness', () => {
        fc.assert(
            fc.property(
                // Generate multiple orientation changes to test transition smoothness
                fc.array(
                    fc.record({
                        width: fc.integer({ min: 320, max: 1024 }),
                        height: fc.integer({ min: 480, max: 1366 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                (orientationSequence) => {
                    const mockImages = [
                        {
                            image_id: 1,
                            filename: 'test1.jpg',
                            original_name: 'test1.jpg',
                            file_path: 'https://example.com/test1.jpg',
                            file_size: 1024,
                            mime_type: 'image/jpeg',
                            uploaded_at: '2023-01-01T00:00:00Z',
                            labels: ['test'],
                            confidences: [0.95],
                            label_count: 1
                        }
                    ]

                    const mockProps = {
                        images: mockImages,
                        pagination: {
                            page: 1,
                            limit: 10,
                            totalImages: 1,
                            totalPages: 1,
                            hasNextPage: false,
                            hasPrevPage: false
                        }
                    }

                    // Start with first orientation
                    const firstOrientation = orientationSequence[0]
                    setViewport(firstOrientation.width, firstOrientation.height)
                    const { rerender, unmount } = render(<ImageGallery {...mockProps} />)

                    try {
                        // Apply each orientation change in sequence
                        for (let i = 1; i < orientationSequence.length; i++) {
                            const orientation = orientationSequence[i]

                            setViewport(orientation.width, orientation.height)
                            fireEvent(window, new Event('orientationchange'))
                            rerender(<ImageGallery {...mockProps} />)

                            // Verify layout remains stable after each change
                            const grid = screen.getByTestId('image-gallery-grid')
                            expect(grid).toBeInTheDocument()

                            // Should maintain grid structure
                            expect(grid.className).toContain('grid')

                            // Should have transition classes for smooth changes (will fail until implemented)
                            const hasTransitions = grid.className.includes('transition') ||
                                grid.className.includes('duration') ||
                                grid.className.includes('ease')

                            expect(hasTransitions).toBe(true)
                        }

                    } finally {
                        unmount()
                    }
                }
            ),
            { numRuns: 10 } // Fewer runs due to complexity of multiple orientation changes
        )
    })
})
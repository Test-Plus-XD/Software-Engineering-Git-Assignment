/**
 * Property-based tests for ImageCard loading states
 * Feature: phase-5-react-frontend, Property 2: Image loading state management
 * Validates: Requirements 1.2, 1.3
 */

import { render, screen, waitFor } from '../../../lib/test-utils/testing-library-utils'
import { imageDataGenerator } from '../../../lib/test-utils/property-test-generators'
import fc from 'fast-check'
import ImageCard from '../ImageCard'

// Mock Next.js Image component with controllable loading behavior
jest.mock('next/image', () => {
    return function MockImage({ src, alt, onLoad, onError, ...props }) {
        const [loaded, setLoaded] = React.useState(false)
        const [error, setError] = React.useState(false)

        React.useEffect(() => {
            // Simulate different loading scenarios based on src
            if (src.includes('error')) {
                setTimeout(() => {
                    setError(true)
                    onError?.()
                }, 100)
            } else if (src.includes('slow')) {
                setTimeout(() => {
                    setLoaded(true)
                    onLoad?.()
                }, 500)
            } else {
                setTimeout(() => {
                    setLoaded(true)
                    onLoad?.()
                }, 50)
            }
        }, [src, onLoad, onError])

        if (error) {
            return <div data-testid="image-error">Failed to load</div>
        }

        if (!loaded) {
            return <div data-testid="image-loading">Loading...</div>
        }

        return (
            <img
                src={src}
                alt={alt}
                data-testid="image"
                {...props}
            />
        )
    }
})

describe('ImageCard Loading States Property Tests', () => {
    /**
     * Feature: phase-5-react-frontend, Property 2: Image loading state management
     * For any image in the ImageCard component, loading states should be displayed while the image loads 
     * and error states should be shown for failed loads
     * Validates: Requirements 1.2, 1.3
     */
    test('Property 2: Image loading state management', async () => {
        fc.assert(
            fc.property(imageDataGenerator(), async (imageData) => {
                // Test normal loading scenario
                const normalImage = { ...imageData, file_path: `https://example.com/normal-${imageData.image_id}.jpg` }

                render(<ImageCard image={normalImage} />)

                // Should show loading skeleton initially
                expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()

                // Should not show the actual image immediately
                expect(screen.queryByTestId('image')).not.toBeInTheDocument()

                // Wait for image to load
                await waitFor(() => {
                    expect(screen.getByTestId('image')).toBeInTheDocument()
                }, { timeout: 1000 })

                // Loading skeleton should be gone
                expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()

                // Clean up for next iteration
                screen.unmount?.()
            }),
            {
                numRuns: 50,
                verbose: true
            }
        )
    })

    /**
     * Property test for slow loading images
     * Ensures loading state persists for slow-loading images
     */
    test('Property 2a: Slow loading image states', async () => {
        fc.assert(
            fc.property(imageDataGenerator(), async (imageData) => {
                // Test slow loading scenario
                const slowImage = { ...imageData, file_path: `https://slow.example.com/slow-${imageData.image_id}.jpg` }

                render(<ImageCard image={slowImage} />)

                // Should show loading skeleton initially
                expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()

                // Should still be loading after a short time
                await new Promise(resolve => setTimeout(resolve, 200))
                expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
                expect(screen.queryByTestId('image')).not.toBeInTheDocument()

                // Eventually should load
                await waitFor(() => {
                    expect(screen.getByTestId('image')).toBeInTheDocument()
                }, { timeout: 1000 })

                // Loading skeleton should be gone
                expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()

                // Clean up for next iteration
                screen.unmount?.()
            }),
            {
                numRuns: 30,
                verbose: true
            }
        )
    })

    /**
     * Property test for error states
     * Ensures error states are displayed for failed image loads
     */
    test('Property 2b: Image error state management', async () => {
        fc.assert(
            fc.property(imageDataGenerator(), async (imageData) => {
                // Test error scenario
                const errorImage = { ...imageData, file_path: `https://error.example.com/error-${imageData.image_id}.jpg` }

                render(<ImageCard image={errorImage} />)

                // Should show loading skeleton initially
                expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()

                // Wait for error state
                await waitFor(() => {
                    expect(screen.getByTestId('error-state')).toBeInTheDocument()
                }, { timeout: 1000 })

                // Should show error message
                expect(screen.getByText('Failed to load image')).toBeInTheDocument()

                // Loading skeleton should be gone
                expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()

                // Actual image should not be present
                expect(screen.queryByTestId('image')).not.toBeInTheDocument()

                // Clean up for next iteration
                screen.unmount?.()
            }),
            {
                numRuns: 30,
                verbose: true
            }
        )
    })

    /**
     * Property test for loading state transitions
     * Ensures proper state transitions from loading to loaded/error
     */
    test('Property 2c: Loading state transitions', async () => {
        fc.assert(
            fc.property(
                fc.record({
                    imageData: imageDataGenerator(),
                    scenario: fc.constantFrom('normal', 'slow', 'error')
                }),
                async ({ imageData, scenario }) => {
                    let testImage
                    switch (scenario) {
                        case 'error':
                            testImage = { ...imageData, file_path: `https://error.example.com/test-${imageData.image_id}.jpg` }
                            break
                        case 'slow':
                            testImage = { ...imageData, file_path: `https://slow.example.com/test-${imageData.image_id}.jpg` }
                            break
                        default:
                            testImage = { ...imageData, file_path: `https://normal.example.com/test-${imageData.image_id}.jpg` }
                    }

                    render(<ImageCard image={testImage} />)

                    // All scenarios should start with loading state
                    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()

                    // Wait for final state
                    if (scenario === 'error') {
                        await waitFor(() => {
                            expect(screen.getByTestId('error-state')).toBeInTheDocument()
                        }, { timeout: 1000 })

                        // Should not have image or loading skeleton
                        expect(screen.queryByTestId('image')).not.toBeInTheDocument()
                        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
                    } else {
                        await waitFor(() => {
                            expect(screen.getByTestId('image')).toBeInTheDocument()
                        }, { timeout: 1000 })

                        // Should not have loading skeleton or error state
                        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
                        expect(screen.queryByTestId('error-state')).not.toBeInTheDocument()
                    }

                    // Clean up for next iteration
                    screen.unmount?.()
                }
            ),
            {
                numRuns: 60,
                verbose: true
            }
        )
    })

    /**
     * Property test for loading skeleton appearance
     * Ensures loading skeleton has proper structure and styling
     */
    test('Property 2d: Loading skeleton structure', () => {
        fc.assert(
            fc.property(imageDataGenerator(), (imageData) => {
                render(<ImageCard image={imageData} />)

                const skeleton = screen.getByTestId('loading-skeleton')
                expect(skeleton).toBeInTheDocument()

                // Should have proper loading animation classes
                expect(skeleton).toHaveClass('animate-pulse')

                // Should have placeholder for image area
                expect(screen.getByTestId('skeleton-image')).toBeInTheDocument()

                // Should have placeholder for labels area
                expect(screen.getByTestId('skeleton-labels')).toBeInTheDocument()

                // Should have proper dimensions
                expect(skeleton).toHaveClass('w-full')

                // Clean up for next iteration
                screen.unmount?.()
            }),
            {
                numRuns: 50,
                verbose: true
            }
        )
    })
})
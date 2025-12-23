/**
 * Failing tests for responsive behavior across all components
 * Following TDD approach - these tests should fail until responsive features are fully implemented
 * **Requirements: 6.4, 6.5**
 */

import { render, screen, waitFor, fireEvent } from '../../../lib/test-utils/testing-library-utils'
import { setViewport, mockPrefersReducedMotion, createUserEvent } from '../../../lib/test-utils/testing-library-utils'
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

describe('Responsive Behavior Tests', () => {
    const mockImages = [
        {
            image_id: 1,
            filename: 'test1.jpg',
            original_name: 'test1.jpg',
            file_path: 'https://example.com/test1.jpg',
            file_size: 1024,
            mime_type: 'image/jpeg',
            uploaded_at: '2023-01-01T00:00:00Z',
            labels: ['cat', 'animal'],
            confidences: [0.95, 0.87],
            label_count: 2
        },
        {
            image_id: 2,
            filename: 'test2.jpg',
            original_name: 'test2.jpg',
            file_path: 'https://example.com/test2.jpg',
            file_size: 2048,
            mime_type: 'image/jpeg',
            uploaded_at: '2023-01-02T00:00:00Z',
            labels: ['dog'],
            confidences: [0.92],
            label_count: 1
        }
    ]

    const mockLabels = [
        { label_id: 1, label_name: 'cat', created_at: '2023-01-01T00:00:00Z' },
        { label_id: 2, label_name: 'dog', created_at: '2023-01-01T00:00:00Z' },
        { label_id: 3, label_name: 'animal', created_at: '2023-01-01T00:00:00Z' }
    ]

    beforeEach(() => {
        // Reset viewport to desktop size
        setViewport(1024, 768)
        // Reset reduced motion preference
        mockPrefersReducedMotion(false)
    })

    describe('Layout adapts to different screen sizes', () => {
        test('ImageGallery adapts grid columns based on screen size', async () => {
            const mockProps = {
                images: mockImages,
                pagination: {
                    page: 1,
                    limit: 10,
                    totalImages: 2,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }

            const { rerender } = render(<ImageGallery {...mockProps} />)

            // Desktop: should show 3 columns
            setViewport(1200, 800)
            rerender(<ImageGallery {...mockProps} />)

            const gridContainer = screen.getByTestId('image-gallery-grid')
            expect(gridContainer).toHaveClass('lg:grid-cols-3')

            // Tablet: should show 2 columns
            setViewport(768, 1024)
            rerender(<ImageGallery {...mockProps} />)

            expect(gridContainer).toHaveClass('md:grid-cols-2')

            // Mobile: should show 1 column
            setViewport(375, 667)
            rerender(<ImageGallery {...mockProps} />)

            expect(gridContainer).toHaveClass('grid-cols-1')
        })

        test('ImageCard adapts sizing based on screen size', () => {
            const { rerender } = render(<ImageCard image={mockImages[0]} />)

            // Mobile: should be full width
            setViewport(375, 667)
            rerender(<ImageCard image={mockImages[0]} />)

            const card = screen.getByTestId('image-card')
            expect(card).toHaveClass('w-full')

            // Tablet: should have max-width constraint
            setViewport(768, 1024)
            rerender(<ImageCard image={mockImages[0]} />)

            expect(card).toHaveClass('max-w-sm')

            // Desktop: should have larger max-width
            setViewport(1200, 800)
            rerender(<ImageCard image={mockImages[0]} />)

            expect(card).toHaveClass('max-w-md')
        })

        test('UploadForm adapts layout for mobile devices', () => {
            const { rerender } = render(<UploadForm />)

            // Desktop: should show full drag and drop interface
            setViewport(1200, 800)
            rerender(<UploadForm />)

            const dropZone = screen.getByTestId('drop-zone')
            expect(dropZone).toBeInTheDocument()
            expect(screen.getByText(/drag and drop your image here/i)).toBeInTheDocument()

            // Mobile: should adapt text and layout
            setViewport(375, 667)
            rerender(<UploadForm />)

            // Should still show drag and drop but with mobile-friendly text
            expect(dropZone).toBeInTheDocument()
            // Text should adapt for smaller screens (this will fail until implemented)
            expect(screen.getByText(/drag and drop your image here/i)).toBeInTheDocument()
        })

        test('LabelSelector adapts dropdown size for mobile', () => {
            const mockProps = {
                selectedLabels: [],
                onLabelsChange: jest.fn(),
                availableLabels: mockLabels
            }

            const { rerender } = render(<LabelSelector {...mockProps} />)

            // Desktop: should show full dropdown
            setViewport(1200, 800)
            rerender(<LabelSelector {...mockProps} />)

            const selector = screen.getByRole('combobox')
            expect(selector).toBeInTheDocument()

            // Mobile: should adapt dropdown size
            setViewport(375, 667)
            rerender(<LabelSelector {...mockProps} />)

            // Should still be accessible but with mobile-friendly sizing
            expect(selector).toBeInTheDocument()
            // This will fail until mobile adaptations are implemented
            expect(selector).toHaveClass('w-full')
        })
    })

    describe('Orientation changes trigger layout updates', () => {
        test('ImageGallery responds to orientation changes', async () => {
            const mockProps = {
                images: mockImages,
                pagination: {
                    page: 1,
                    limit: 10,
                    totalImages: 2,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }

            render(<ImageGallery {...mockProps} />)

            // Portrait tablet
            setViewport(768, 1024)
            fireEvent(window, new Event('orientationchange'))

            await waitFor(() => {
                const gridContainer = screen.getByTestId('image-gallery-grid')
                expect(gridContainer).toHaveClass('md:grid-cols-2')
            })

            // Landscape tablet (should behave like desktop)
            setViewport(1024, 768)
            fireEvent(window, new Event('orientationchange'))

            await waitFor(() => {
                const gridContainer = screen.getByTestId('image-gallery-grid')
                expect(gridContainer).toHaveClass('lg:grid-cols-3')
            })
        })

        test('Components handle rapid orientation changes gracefully', async () => {
            const mockProps = {
                images: mockImages,
                pagination: {
                    page: 1,
                    limit: 10,
                    totalImages: 2,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            }

            render(<ImageGallery {...mockProps} />)

            // Simulate rapid orientation changes
            setViewport(375, 667) // Portrait mobile
            fireEvent(window, new Event('orientationchange'))

            setViewport(667, 375) // Landscape mobile
            fireEvent(window, new Event('orientationchange'))

            setViewport(768, 1024) // Portrait tablet
            fireEvent(window, new Event('orientationchange'))

            setViewport(1024, 768) // Landscape tablet
            fireEvent(window, new Event('orientationchange'))

            // Should not crash and should maintain proper layout
            await waitFor(() => {
                const gridContainer = screen.getByTestId('image-gallery-grid')
                expect(gridContainer).toBeInTheDocument()
                expect(gridContainer).toHaveClass('grid')
            })
        })
    })

    describe('Touch interactions provide appropriate feedback', () => {
        test('ImageCard provides touch feedback on mobile', async () => {
            const user = createUserEvent()
            const mockOnLabelClick = jest.fn()

            setViewport(375, 667) // Mobile viewport
            render(<ImageCard image={mockImages[0]} onLabelClick={mockOnLabelClick} />)

            const card = screen.getByTestId('image-card')

            // Touch interaction should provide visual feedback
            await user.pointer([
                { keys: '[TouchA>]', target: card },
                { keys: '[/TouchA]' }
            ])

            // Should have touch-friendly hover states (this will fail until implemented)
            expect(card).toHaveClass('active:scale-95')
        })

        test('UploadForm provides touch feedback for drag and drop', async () => {
            const user = createUserEvent()

            setViewport(375, 667) // Mobile viewport
            render(<UploadForm />)

            const dropZone = screen.getByTestId('drop-zone')

            // Touch drag should provide feedback
            await user.pointer([
                { keys: '[TouchA>]', target: dropZone },
                { keys: '[/TouchA]' }
            ])

            // Should provide touch feedback (this will fail until implemented)
            expect(dropZone).toHaveClass('active:bg-blue-100')
        })

        test('LabelSelector provides touch feedback for selections', async () => {
            const user = createUserEvent()
            const mockOnLabelsChange = jest.fn()

            setViewport(375, 667) // Mobile viewport
            render(
                <LabelSelector
                    selectedLabels={[]}
                    onLabelsChange={mockOnLabelsChange}
                    availableLabels={mockLabels}
                />
            )

            const selector = screen.getByRole('combobox')

            // Touch interaction should provide feedback
            await user.pointer([
                { keys: '[TouchA>]', target: selector },
                { keys: '[/TouchA]' }
            ])

            // Should have touch-friendly feedback (this will fail until implemented)
            expect(selector).toHaveClass('active:ring-2')
        })

        test('Buttons provide appropriate touch feedback', async () => {
            const user = createUserEvent()

            setViewport(375, 667) // Mobile viewport
            render(<UploadForm />)

            const chooseFileButton = screen.getByText('Choose File')

            // Touch interaction should provide feedback
            await user.pointer([
                { keys: '[TouchA>]', target: chooseFileButton },
                { keys: '[/TouchA]' }
            ])

            // Should have touch feedback (this will fail until implemented)
            expect(chooseFileButton).toHaveClass('active:bg-blue-700')
        })
    })

    describe('Touch targets meet minimum size requirements', () => {
        test('All interactive elements meet 44px minimum touch target', () => {
            setViewport(375, 667) // Mobile viewport

            // Test ImageCard labels
            render(<ImageCard image={mockImages[0]} onLabelClick={jest.fn()} />)

            const labels = screen.getAllByText(/cat|animal/)
            labels.forEach(label => {
                const styles = window.getComputedStyle(label.closest('div'))
                const minHeight = parseInt(styles.minHeight) || parseInt(styles.height)
                const minWidth = parseInt(styles.minWidth) || parseInt(styles.width)

                // Should meet 44px minimum (this will fail until implemented)
                expect(minHeight).toBeGreaterThanOrEqual(44)
                expect(minWidth).toBeGreaterThanOrEqual(44)
            })
        })

        test('UploadForm buttons meet minimum touch target size', () => {
            setViewport(375, 667) // Mobile viewport
            render(<UploadForm />)

            const chooseFileButton = screen.getByText('Choose File')
            const styles = window.getComputedStyle(chooseFileButton)
            const height = parseInt(styles.height)
            const width = parseInt(styles.width)

            // Should meet 44px minimum (this will fail until implemented)
            expect(height).toBeGreaterThanOrEqual(44)
            expect(width).toBeGreaterThanOrEqual(44)
        })

        test('LabelSelector dropdown items meet minimum touch target', () => {
            setViewport(375, 667) // Mobile viewport

            const mockProps = {
                selectedLabels: [],
                onLabelsChange: jest.fn(),
                availableLabels: mockLabels
            }

            render(<LabelSelector {...mockProps} />)

            const selector = screen.getByRole('combobox')
            const styles = window.getComputedStyle(selector)
            const height = parseInt(styles.height)

            // Should meet 44px minimum (this will fail until implemented)
            expect(height).toBeGreaterThanOrEqual(44)
        })

        test('Pagination controls meet minimum touch target size', () => {
            setViewport(375, 667) // Mobile viewport

            const mockProps = {
                images: mockImages,
                pagination: {
                    page: 1,
                    limit: 1,
                    totalImages: 2,
                    totalPages: 2,
                    hasNextPage: true,
                    hasPrevPage: false
                }
            }

            render(<ImageGallery {...mockProps} />)

            const nextButton = screen.getByRole('button', { name: /next/i })
            const styles = window.getComputedStyle(nextButton)
            const height = parseInt(styles.height)
            const width = parseInt(styles.width)

            // Should meet 44px minimum (this will fail until implemented)
            expect(height).toBeGreaterThanOrEqual(44)
            expect(width).toBeGreaterThanOrEqual(44)
        })
    })

    describe('Accessibility considerations for responsive design', () => {
        test('Focus indicators are visible on all screen sizes', async () => {
            const user = createUserEvent()

            // Test on mobile
            setViewport(375, 667)
            render(<UploadForm />)

            const chooseFileButton = screen.getByText('Choose File')
            await user.tab()

            // Should have visible focus indicator (this will fail until implemented)
            expect(chooseFileButton).toHaveClass('focus:ring-2')
            expect(chooseFileButton).toHaveClass('focus:ring-blue-500')
        })

        test('Text remains readable at all screen sizes', () => {
            const { rerender } = render(<ImageCard image={mockImages[0]} />)

            // Test readability on small screens
            setViewport(320, 568) // Very small mobile
            rerender(<ImageCard image={mockImages[0]} />)

            const labelText = screen.getByText('cat')
            const styles = window.getComputedStyle(labelText)
            const fontSize = parseInt(styles.fontSize)

            // Should maintain readable font size (this will fail until implemented)
            expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size
        })

        test('Interactive elements have sufficient spacing on touch devices', () => {
            setViewport(375, 667) // Mobile viewport

            const mockProps = {
                selectedLabels: ['cat'],
                onLabelsChange: jest.fn(),
                availableLabels: mockLabels
            }

            render(<LabelSelector {...mockProps} />)

            // Should have adequate spacing between interactive elements
            const selector = screen.getByRole('combobox')
            const styles = window.getComputedStyle(selector)
            const margin = parseInt(styles.margin) || parseInt(styles.marginBottom)

            // Should have sufficient spacing (this will fail until implemented)
            expect(margin).toBeGreaterThanOrEqual(8) // Minimum 8px spacing
        })
    })
})
/**
 * Failing tests for ImageCard component
 * Following TDD approach - these tests should fail until component is implemented
 */

import { render, screen, waitFor } from '../../../lib/test-utils/testing-library-utils'
import { setViewport } from '../../../lib/test-utils/testing-library-utils'
import ImageCard from '../ImageCard'

// Mock Next.js Image component for testing
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

describe('ImageCard Component', () => {
    const mockImageData = {
        image_id: 1,
        filename: 'test-image.jpg',
        original_name: 'test-image.jpg',
        file_path: 'https://firebasestorage.googleapis.com/test-image.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        uploaded_at: '2024-01-01T00:00:00.000Z',
        labels: ['cat', 'animal'],
        confidences: [0.95, 0.88],
        label_count: 2
    }

    const mockImageWithoutLabels = {
        ...mockImageData,
        labels: [],
        confidences: [],
        label_count: 0
    }

    beforeEach(() => {
        // Reset viewport to desktop size
        setViewport(1024, 768)
    })

    test('renders image with src from Firebase URL', () => {
        render(<ImageCard image={mockImageData} />)

        const image = screen.getByTestId('image')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', mockImageData.file_path)
        expect(image).toHaveAttribute('alt', mockImageData.original_name)
    })

    test('displays all associated labels with confidence scores', () => {
        render(<ImageCard image={mockImageData} />)

        // Should display both labels
        expect(screen.getByText('cat')).toBeInTheDocument()
        expect(screen.getByText('animal')).toBeInTheDocument()

        // Should display confidence scores
        expect(screen.getByText('95%')).toBeInTheDocument()
        expect(screen.getByText('88%')).toBeInTheDocument()

        // Should show label count
        expect(screen.getByText('2 labels')).toBeInTheDocument()
    })

    test('displays no labels message when image has no labels', () => {
        render(<ImageCard image={mockImageWithoutLabels} />)

        expect(screen.getByText('No labels')).toBeInTheDocument()
        expect(screen.queryByText('cat')).not.toBeInTheDocument()
        expect(screen.queryByText('animal')).not.toBeInTheDocument()
    })

    test('shows loading state whilst image loads', async () => {
        // Mock a slow-loading image
        const slowLoadingImage = {
            ...mockImageData,
            file_path: 'https://slow-loading-image.com/test.jpg'
        }

        render(<ImageCard image={slowLoadingImage} />)

        // Should show loading skeleton initially
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()

        // Should not show the actual image yet
        expect(screen.queryByTestId('image')).not.toBeInTheDocument()
    })

    test('handles missing image gracefully with error state', async () => {
        const brokenImageData = {
            ...mockImageData,
            file_path: 'https://broken-image-url.com/missing.jpg'
        }

        render(<ImageCard image={brokenImageData} />)

        // Simulate image load error
        const image = screen.getByTestId('image')
        image.dispatchEvent(new Event('error'))

        await waitFor(() => {
            expect(screen.getByTestId('error-state')).toBeInTheDocument()
            expect(screen.getByText('Failed to load image')).toBeInTheDocument()
        })
    })

    test('shows image details on hover', async () => {
        const { createUserEvent } = require('../../../lib/test-utils/testing-library-utils')
        const user = createUserEvent()

        render(<ImageCard image={mockImageData} />)

        const card = screen.getByTestId('image-card')
        await user.hover(card)

        // Should show additional details on hover
        expect(screen.getByText('1.0 MB')).toBeInTheDocument() // File size
        expect(screen.getByText('JPEG')).toBeInTheDocument() // File type
        expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument() // Upload date
    })

    test('responsive image sizing across different screen sizes', () => {
        // Test mobile viewport
        setViewport(375, 667)
        const { rerender } = render(<ImageCard image={mockImageData} />)

        let card = screen.getByTestId('image-card')
        expect(card).toHaveClass('w-full') // Full width on mobile

        // Test tablet viewport
        setViewport(768, 1024)
        rerender(<ImageCard image={mockImageData} />)

        card = screen.getByTestId('image-card')
        expect(card).toHaveClass('max-w-sm') // Constrained width on tablet

        // Test desktop viewport
        setViewport(1200, 800)
        rerender(<ImageCard image={mockImageData} />)

        card = screen.getByTestId('image-card')
        expect(card).toHaveClass('max-w-md') // Larger max width on desktop
    })

    test('calls onLabelClick when label is clicked', async () => {
        const { createUserEvent } = require('../../../lib/test-utils/testing-library-utils')
        const user = createUserEvent()
        const mockOnLabelClick = jest.fn()

        render(<ImageCard image={mockImageData} onLabelClick={mockOnLabelClick} />)

        const catLabel = screen.getByText('cat')
        await user.click(catLabel)

        expect(mockOnLabelClick).toHaveBeenCalledWith('cat')
    })

    test('applies custom className when provided', () => {
        render(<ImageCard image={mockImageData} className="custom-class" />)

        const card = screen.getByTestId('image-card')
        expect(card).toHaveClass('custom-class')
    })

    test('displays file size in human readable format', () => {
        const largeImageData = {
            ...mockImageData,
            file_size: 5242880 // 5MB
        }

        render(<ImageCard image={largeImageData} />)

        const card = screen.getByTestId('image-card')
        // Hover to show details
        card.dispatchEvent(new Event('mouseenter'))

        expect(screen.getByText('5.0 MB')).toBeInTheDocument()
    })

    test('shows upload date in readable format', () => {
        render(<ImageCard image={mockImageData} />)

        const card = screen.getByTestId('image-card')
        // Hover to show details
        card.dispatchEvent(new Event('mouseenter'))

        expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
    })
})
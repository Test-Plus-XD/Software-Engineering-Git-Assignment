/**
 * Property-based tests for touch interaction responsiveness
 * **Feature: phase-5-react-frontend, Property 10: Touch interaction responsiveness**
 * **Validates: Requirements 6.5**
 */

import { render, screen, cleanup } from '../../../lib/test-utils/testing-library-utils'
import { setViewport, createUserEvent } from '../../../lib/test-utils/testing-library-utils'
import fc from 'fast-check'
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

describe('Touch Interaction Responsiveness Properties', () => {
    beforeEach(() => {
        // Set mobile viewport for touch testing
        setViewport(375, 667)
    })

    afterEach(() => {
        cleanup()
    })

    /**
     * Property 10: Touch interaction responsiveness
     * For any touch interaction, the system should provide appropriate touch targets and feedback
     * **Validates: Requirements 6.5**
     */
    test('Property 10: Touch interaction responsiveness', () => {
        fc.assert(
            fc.property(
                // Generate random image data for testing
                fc.record({
                    image_id: fc.integer({ min: 1, max: 1000 }),
                    filename: fc.string({ minLength: 5, maxLength: 20 }).map(s => s + '.jpg'),
                    original_name: fc.string({ minLength: 5, maxLength: 20 }).map(s => s + '.jpg'),
                    file_path: fc.webUrl(),
                    file_size: fc.integer({ min: 1024, max: 10485760 }),
                    mime_type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
                    uploaded_at: fc.date().map(d => d.toISOString()),
                    labels: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { maxLength: 5 }),
                    confidences: fc.array(fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }), { maxLength: 5 }),
                    label_count: fc.integer({ min: 0, max: 5 })
                }),
                // Generate random viewport dimensions for mobile/tablet range
                fc.record({
                    width: fc.integer({ min: 320, max: 768 }), // Mobile to tablet range
                    height: fc.integer({ min: 480, max: 1024 })
                }),
                (imageData, viewport) => {
                    // Ensure labels and confidences arrays match
                    const normalizedImageData = {
                        ...imageData,
                        labels: imageData.labels.slice(0, imageData.label_count),
                        confidences: imageData.confidences.slice(0, imageData.label_count)
                    }

                    // Set the viewport for this test iteration
                    setViewport(viewport.width, viewport.height)

                    // Test ImageCard touch responsiveness
                    const mockOnLabelClick = jest.fn()
                    const { unmount: unmountImageCard } = render(
                        <ImageCard
                            image={normalizedImageData}
                            onLabelClick={mockOnLabelClick}
                        />
                    )

                    try {
                        const imageCard = screen.getByTestId('image-card')

                        // Verify touch-friendly classes are present (will fail until implemented)
                        // Touch targets should have appropriate feedback classes
                        const cardClasses = imageCard.className
                        const hasTouchFeedback = cardClasses.includes('active:') ||
                            cardClasses.includes('touch:') ||
                            cardClasses.includes('hover:')

                        expect(hasTouchFeedback).toBe(true)

                        // Verify minimum touch target size
                        const cardRect = imageCard.getBoundingClientRect()
                        expect(cardRect.width).toBeGreaterThanOrEqual(44)
                        expect(cardRect.height).toBeGreaterThanOrEqual(44)

                        // Test label touch targets if labels exist
                        if (normalizedImageData.labels.length > 0) {
                            const labelElements = screen.getAllByText(new RegExp(normalizedImageData.labels.join('|')))
                            labelElements.forEach(labelElement => {
                                const labelRect = labelElement.getBoundingClientRect()
                                // Labels should meet minimum touch target requirements
                                expect(Math.max(labelRect.width, labelRect.height)).toBeGreaterThanOrEqual(44)
                            })
                        }
                    } finally {
                        unmountImageCard()
                    }

                    // Test UploadForm touch responsiveness
                    const { unmount: unmountUploadForm } = render(<UploadForm />)

                    try {
                        const dropZone = screen.getByTestId('drop-zone')
                        const chooseFileButton = screen.getByText('Choose File')

                        // Verify drop zone has touch feedback classes (will fail until implemented)
                        const dropZoneClasses = dropZone.className
                        const hasDropZoneTouchFeedback = dropZoneClasses.includes('active:') ||
                            dropZoneClasses.includes('touch:')

                        expect(hasDropZoneTouchFeedback).toBe(true)

                        // Verify button meets touch target requirements
                        const buttonRect = chooseFileButton.getBoundingClientRect()
                        expect(buttonRect.width).toBeGreaterThanOrEqual(44)
                        expect(buttonRect.height).toBeGreaterThanOrEqual(44)

                        // Verify button has touch feedback classes (will fail until implemented)
                        const buttonClasses = chooseFileButton.className
                        const hasButtonTouchFeedback = buttonClasses.includes('active:') ||
                            buttonClasses.includes('touch:')

                        expect(hasButtonTouchFeedback).toBe(true)
                    } finally {
                        unmountUploadForm()
                    }

                    // Test LabelSelector touch responsiveness
                    const mockLabels = [
                        { label_id: 1, label_name: 'cat', created_at: '2023-01-01T00:00:00Z' },
                        { label_id: 2, label_name: 'dog', created_at: '2023-01-01T00:00:00Z' }
                    ]

                    const { unmount: unmountLabelSelector } = render(
                        <LabelSelector
                            selectedLabels={[]}
                            onLabelsChange={jest.fn()}
                            availableLabels={mockLabels}
                        />
                    )

                    try {
                        const dropdown = screen.getByTestId('label-selector-dropdown')

                        // Verify dropdown meets touch target requirements
                        const dropdownRect = dropdown.getBoundingClientRect()
                        expect(dropdownRect.height).toBeGreaterThanOrEqual(44)

                        // Verify dropdown has touch feedback classes (will fail until implemented)
                        const dropdownClasses = dropdown.className
                        const hasDropdownTouchFeedback = dropdownClasses.includes('active:') ||
                            dropdownClasses.includes('touch:') ||
                            dropdownClasses.includes('focus-within:')

                        expect(hasDropdownTouchFeedback).toBe(true)
                    } finally {
                        unmountLabelSelector()
                    }
                }
            ),
            { numRuns: 25 } // Reduced runs for performance while still testing various scenarios
        )
    })

    /**
     * Additional property test for touch target consistency across components
     */
    test('Property 10a: Touch target size consistency', () => {
        fc.assert(
            fc.property(
                // Generate different mobile viewport sizes
                fc.record({
                    width: fc.integer({ min: 320, max: 480 }), // Small mobile range
                    height: fc.integer({ min: 568, max: 896 })
                }),
                (viewport) => {
                    setViewport(viewport.width, viewport.height)

                    // Test that all interactive elements maintain consistent minimum sizes
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

                    // Test ImageCard
                    const { unmount: unmountImageCard } = render(
                        <ImageCard image={mockImageData} onLabelClick={jest.fn()} />
                    )

                    try {
                        const imageCard = screen.getByTestId('image-card')
                        const cardRect = imageCard.getBoundingClientRect()

                        // Should maintain minimum touch target size regardless of viewport
                        expect(cardRect.width).toBeGreaterThanOrEqual(44)
                        expect(cardRect.height).toBeGreaterThanOrEqual(44)
                    } finally {
                        unmountImageCard()
                    }

                    // Test UploadForm button
                    const { unmount: unmountUploadForm } = render(<UploadForm />)

                    try {
                        const button = screen.getByText('Choose File')
                        const buttonRect = button.getBoundingClientRect()

                        // Should maintain minimum touch target size
                        expect(buttonRect.width).toBeGreaterThanOrEqual(44)
                        expect(buttonRect.height).toBeGreaterThanOrEqual(44)
                    } finally {
                        unmountUploadForm()
                    }
                }
            ),
            { numRuns: 15 } // Test across different small mobile viewports
        )
    })

    /**
     * Property test for touch feedback timing and visual response
     */
    test('Property 10b: Touch feedback visual response', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 768 }), // Viewport width
                fc.integer({ min: 480, max: 1024 }), // Viewport height
                (width, height) => {
                    setViewport(width, height)

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

                    const { unmount } = render(
                        <ImageCard image={mockImageData} onLabelClick={jest.fn()} />
                    )

                    try {
                        const imageCard = screen.getByTestId('image-card')

                        // Check for transition classes that provide smooth feedback
                        const cardClasses = imageCard.className
                        const hasTransitions = cardClasses.includes('transition') ||
                            cardClasses.includes('duration') ||
                            cardClasses.includes('ease')

                        // Should have smooth transitions for touch feedback (will fail until implemented)
                        expect(hasTransitions).toBe(true)

                        // Check for hover/active states that provide visual feedback
                        const hasVisualFeedback = cardClasses.includes('hover:') ||
                            cardClasses.includes('active:') ||
                            cardClasses.includes('focus:')

                        expect(hasVisualFeedback).toBe(true)
                    } finally {
                        unmount()
                    }
                }
            ),
            { numRuns: 20 }
        )
    })
})
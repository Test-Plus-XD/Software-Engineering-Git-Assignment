/**
 * Property-based tests for ImageCard component
 * Feature: phase-5-react-frontend, Property 3: Label display completeness
 * Validates: Requirements 1.5
 */

import { render, screen } from '../../../lib/test-utils/testing-library-utils'
import { imageDataGenerator } from '../../../lib/test-utils/property-test-generators'
import fc from 'fast-check'
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

describe('ImageCard Property Tests', () => {
    /**
     * Feature: phase-5-react-frontend, Property 3: Label display completeness
     * For any image with associated labels, the ImageCard component should display all labels with their confidence scores
     * Validates: Requirements 1.5
     */
    test('Property 3: Label display completeness', () => {
        fc.assert(
            fc.property(imageDataGenerator(), (imageData) => {
                // Only test images that have labels
                fc.pre(imageData.labels.length > 0)
                fc.pre(imageData.confidences.length === imageData.labels.length)

                render(<ImageCard image={imageData} />)

                // Verify all labels are displayed
                imageData.labels.forEach((label) => {
                    expect(screen.getByText(label)).toBeInTheDocument()
                })

                // Verify all confidence scores are displayed as percentages
                imageData.confidences.forEach((confidence) => {
                    const percentage = Math.round(confidence * 100)
                    expect(screen.getByText(`${percentage}%`)).toBeInTheDocument()
                })

                // Verify label count is displayed correctly
                const expectedLabelText = imageData.label_count === 1 ? '1 label' : `${imageData.label_count} labels`
                expect(screen.getByText(expectedLabelText)).toBeInTheDocument()

                // Verify label count matches actual labels array length
                expect(imageData.label_count).toBe(imageData.labels.length)

                // Clean up for next iteration
                screen.unmount?.()
            }),
            {
                numRuns: 100,
                verbose: true
            }
        )
    })

    /**
     * Property test for images without labels
     * Ensures empty state is handled correctly
     */
    test('Property 3a: Empty labels handling', () => {
        fc.assert(
            fc.property(imageDataGenerator(), (imageData) => {
                // Only test images that have no labels
                fc.pre(imageData.labels.length === 0)
                fc.pre(imageData.label_count === 0)

                render(<ImageCard image={imageData} />)

                // Should display "No labels" message
                expect(screen.getByText('No labels')).toBeInTheDocument()

                // Should not display any confidence percentages
                const percentageRegex = /\d+%/
                const percentageElements = screen.queryAllByText(percentageRegex)
                expect(percentageElements).toHaveLength(0)

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
     * Property test for label click interactions
     * Ensures all labels are clickable when onLabelClick is provided
     */
    test('Property 3b: Label click interactions', async () => {
        const { createUserEvent } = require('../../../lib/test-utils/testing-library-utils')

        fc.assert(
            fc.property(imageDataGenerator(), async (imageData) => {
                // Only test images that have labels
                fc.pre(imageData.labels.length > 0)

                const mockOnLabelClick = jest.fn()
                const user = createUserEvent()

                render(<ImageCard image={imageData} onLabelClick={mockOnLabelClick} />)

                // Click each label and verify the callback is called
                for (const label of imageData.labels) {
                    const labelElement = screen.getByText(label)
                    await user.click(labelElement)
                    expect(mockOnLabelClick).toHaveBeenCalledWith(label)
                }

                // Verify callback was called exactly once per label
                expect(mockOnLabelClick).toHaveBeenCalledTimes(imageData.labels.length)

                // Clean up for next iteration
                mockOnLabelClick.mockClear()
                screen.unmount?.()
            }),
            {
                numRuns: 50,
                verbose: true
            }
        )
    })

    /**
     * Property test for confidence score formatting
     * Ensures confidence scores are always displayed as valid percentages
     */
    test('Property 3c: Confidence score formatting', () => {
        fc.assert(
            fc.property(imageDataGenerator(), (imageData) => {
                // Only test images that have labels and confidences
                fc.pre(imageData.labels.length > 0)
                fc.pre(imageData.confidences.length === imageData.labels.length)
                fc.pre(imageData.confidences.every(c => c >= 0 && c <= 1))

                render(<ImageCard image={imageData} />)

                // Verify each confidence score is formatted correctly
                imageData.confidences.forEach((confidence) => {
                    const percentage = Math.round(confidence * 100)

                    // Should be between 0 and 100
                    expect(percentage).toBeGreaterThanOrEqual(0)
                    expect(percentage).toBeLessThanOrEqual(100)

                    // Should be displayed with % symbol
                    expect(screen.getByText(`${percentage}%`)).toBeInTheDocument()
                })

                // Clean up for next iteration
                screen.unmount?.()
            }),
            {
                numRuns: 100,
                verbose: true
            }
        )
    })
})
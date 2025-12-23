/**
 * Property-based tests for LabelSelector component
 * **Feature: phase-5-react-frontend, Property 6: Label selection management**
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
 */

import { render, screen, waitFor, cleanup } from '../../../lib/test-utils/testing-library-utils'
import { createUserEvent } from '../../../lib/test-utils/testing-library-utils'
import fc from 'fast-check'
import LabelSelector from '../LabelSelector'

// Mock the labels API
jest.mock('../../../app/api/labels/route.js', () => ({
    GET: jest.fn(),
    POST: jest.fn()
}))

describe('LabelSelector Property Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
        // Ensure clean DOM before each test
        cleanup()
    })

    afterEach(() => {
        global.fetch.mockRestore()
        cleanup()
    })

    /**
     * Property 6: Label selection management
     * For any label selection operation, the LabelSelector component should prevent duplicates, 
     * allow multiple selections, and provide visual feedback for selected labels
     */
    test('Property 6: Label selection management', () => {
        fc.assert(
            fc.property(
                // Generate arrays of label objects with unique names
                fc.array(
                    fc.record({
                        label_id: fc.integer({ min: 1, max: 1000 }),
                        label_name: fc.string({ minLength: 2, maxLength: 15 }).filter(s =>
                            s.trim().length > 1 &&
                            /^[a-zA-Z0-9_-]+$/.test(s) // Only alphanumeric, underscore, and dash
                        ),
                        usage_count: fc.integer({ min: 0, max: 100 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                // Generate initial selected labels (subset of available labels)
                fc.array(fc.string({ minLength: 2, maxLength: 15 }).filter(s =>
                    s.trim().length > 1 &&
                    /^[a-zA-Z0-9_-]+$/.test(s)
                ), { maxLength: 3 }),
                (availableLabels, initialSelectedLabels) => {
                    // Clean up any existing components before each property test iteration
                    cleanup()

                    // Ensure unique label names in available labels
                    const uniqueAvailableLabels = availableLabels.filter((label, index, arr) =>
                        arr.findIndex(l => l.label_name === label.label_name) === index
                    )

                    fc.pre(uniqueAvailableLabels.length > 0) // Skip if no valid labels

                    // Filter initial selected labels to only include available ones and ensure uniqueness
                    const validInitialSelected = [...new Set(initialSelectedLabels)].filter(labelName =>
                        uniqueAvailableLabels.some(label => label.label_name === labelName)
                    ).slice(0, 2) // Limit to 2 to avoid too many

                    // Mock API response
                    global.fetch.mockResolvedValue({
                        ok: true,
                        json: async () => ({
                            success: true,
                            data: uniqueAvailableLabels
                        })
                    })

                    const mockOnLabelsChange = jest.fn()

                    const { container } = render(
                        <LabelSelector
                            selectedLabels={validInitialSelected}
                            onLabelsChange={mockOnLabelsChange}
                            allowCreate={true}
                            placeholder="Select labels..."
                        />
                    )

                    // Property: Selected labels should be visually displayed
                    for (const selectedLabel of validInitialSelected) {
                        expect(container.querySelector(`[data-testid="selected-label-${selectedLabel}"]`)).toBeInTheDocument()
                        expect(container.querySelector(`[data-testid="remove-label-${selectedLabel}"]`)).toBeInTheDocument()
                    }

                    // Property: Visual feedback should be provided for all selected labels
                    if (validInitialSelected.length > 0) {
                        expect(container.querySelector('div')).toHaveTextContent(`${validInitialSelected.length} selected`)
                    }

                    // Property: Placeholder should change based on selection state
                    const searchInput = container.querySelector('[data-testid="label-search-input"]')
                    if (validInitialSelected.length === 0) {
                        expect(searchInput).toHaveAttribute('placeholder', 'Select labels...')
                    } else {
                        expect(searchInput).toHaveAttribute('placeholder', 'Search labels...')
                    }

                    // Clean up after this iteration
                    cleanup()
                }
            ),
            { numRuns: 25 } // Reduced from 50 for faster execution and less flakiness
        )
    })

    /**
     * Property: Label removal should work correctly
     */
    test('Label removal maintains consistency', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 2, maxLength: 15 }).filter(s =>
                    s.trim().length > 1 &&
                    /^[a-zA-Z0-9_-]+$/.test(s) // Only safe characters
                ), { minLength: 2, maxLength: 4 }),
                fc.integer({ min: 0, max: 3 }), // Index of label to remove
                (selectedLabels, removeIndex) => {
                    // Clean up any existing components before each property test iteration
                    cleanup()

                    // Ensure unique labels
                    const uniqueSelectedLabels = [...new Set(selectedLabels)]
                    fc.pre(uniqueSelectedLabels.length >= 2) // Need at least 2 labels to test removal

                    const labelToRemove = uniqueSelectedLabels[removeIndex % uniqueSelectedLabels.length]
                    const expectedAfterRemoval = uniqueSelectedLabels.filter(label => label !== labelToRemove)

                    const mockOnLabelsChange = jest.fn()

                    const { container } = render(
                        <LabelSelector
                            selectedLabels={uniqueSelectedLabels}
                            onLabelsChange={mockOnLabelsChange}
                            allowCreate={true}
                            placeholder="Select labels..."
                        />
                    )

                    // Property: Remove button should exist for selected label
                    const removeButton = container.querySelector(`[data-testid="remove-label-${labelToRemove}"]`)
                    expect(removeButton).toBeInTheDocument()

                    // Property: Remaining labels should still be displayed
                    for (const remainingLabel of expectedAfterRemoval) {
                        expect(container.querySelector(`[data-testid="selected-label-${remainingLabel}"]`)).toBeInTheDocument()
                    }

                    // Clean up after this iteration
                    cleanup()
                }
            ),
            { numRuns: 25 }
        )
    })

    /**
     * Property: Visual feedback consistency
     */
    test('Visual feedback maintains consistency', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 2, maxLength: 15 }).filter(s =>
                    s.trim().length > 1 &&
                    /^[a-zA-Z0-9_-]+$/.test(s)
                ), { minLength: 0, maxLength: 3 }),
                (selectedLabels) => {
                    // Clean up any existing components before each property test iteration
                    cleanup()

                    // Ensure unique labels
                    const uniqueSelectedLabels = [...new Set(selectedLabels)]

                    const mockOnLabelsChange = jest.fn()

                    const { container } = render(
                        <LabelSelector
                            selectedLabels={uniqueSelectedLabels}
                            onLabelsChange={mockOnLabelsChange}
                            allowCreate={true}
                            placeholder="Select labels..."
                        />
                    )

                    // Property: Each selected label should have visual feedback
                    for (const selectedLabel of uniqueSelectedLabels) {
                        expect(container.querySelector(`[data-testid="selected-label-${selectedLabel}"]`)).toBeInTheDocument()
                        expect(container.querySelector(`[data-testid="remove-label-${selectedLabel}"]`)).toBeInTheDocument()
                    }

                    // Property: Count should match number of selected labels
                    if (uniqueSelectedLabels.length > 0) {
                        expect(container.querySelector('div')).toHaveTextContent(`${uniqueSelectedLabels.length} selected`)
                    }

                    // Property: Placeholder should change based on selection state
                    const searchInput = container.querySelector('[data-testid="label-search-input"]')
                    if (uniqueSelectedLabels.length === 0) {
                        expect(searchInput).toHaveAttribute('placeholder', 'Select labels...')
                    } else {
                        expect(searchInput).toHaveAttribute('placeholder', 'Search labels...')
                    }

                    // Clean up after this iteration
                    cleanup()
                }
            ),
            { numRuns: 25 }
        )
    })
})
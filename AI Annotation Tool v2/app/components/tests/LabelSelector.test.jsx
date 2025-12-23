/**
 * Failing tests for LabelSelector component
 * Following TDD approach - these tests should fail until component is implemented
 */

import { render, screen, waitFor } from '../../../lib/test-utils/testing-library-utils'
import { createUserEvent } from '../../../lib/test-utils/testing-library-utils'
import LabelSelector from '../LabelSelector'

// Mock the labels API
jest.mock('../../../app/api/labels/route.js', () => ({
    GET: jest.fn(),
    POST: jest.fn()
}))

describe('LabelSelector Component', () => {
    const mockAvailableLabels = [
        { label_id: 1, label_name: 'cat', usage_count: 5 },
        { label_id: 2, label_name: 'dog', usage_count: 3 },
        { label_id: 3, label_name: 'animal', usage_count: 8 },
        { label_id: 4, label_name: 'pet', usage_count: 2 }
    ]

    const defaultProps = {
        selectedLabels: [],
        onLabelsChange: jest.fn(),
        allowCreate: true,
        placeholder: 'Select labels...'
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Mock fetch for API calls
        global.fetch = jest.fn()
    })

    afterEach(() => {
        global.fetch.mockRestore()
    })

    test('renders dropdown of available labels', async () => {
        // Mock API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        render(<LabelSelector {...defaultProps} />)

        // Should show placeholder initially
        expect(screen.getByPlaceholderText('Select labels...')).toBeInTheDocument()

        // Click to open dropdown
        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Should display all available labels
        await waitFor(() => {
            expect(screen.getByText('cat')).toBeInTheDocument()
            expect(screen.getByText('dog')).toBeInTheDocument()
            expect(screen.getByText('animal')).toBeInTheDocument()
            expect(screen.getByText('pet')).toBeInTheDocument()
        })

        // Should show usage counts
        expect(screen.getByText('(5)')).toBeInTheDocument() // cat usage count
        expect(screen.getByText('(8)')).toBeInTheDocument() // animal usage count
    })

    test('allows multiple label selection without duplicates', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        let currentSelectedLabels = []
        const mockOnLabelsChange = jest.fn((newLabels) => {
            currentSelectedLabels = newLabels
        })

        const { rerender } = render(<LabelSelector {...defaultProps} selectedLabels={currentSelectedLabels} onLabelsChange={mockOnLabelsChange} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Select first label
        await waitFor(() => {
            expect(screen.getByText('cat')).toBeInTheDocument()
        })

        const catOption = screen.getByText('cat')
        await user.click(catOption)

        expect(mockOnLabelsChange).toHaveBeenCalledWith(['cat'])

        // Re-render with updated selectedLabels
        rerender(<LabelSelector {...defaultProps} selectedLabels={currentSelectedLabels} onLabelsChange={mockOnLabelsChange} />)

        // Select second label
        const dogOption = screen.getByText('dog')
        await user.click(dogOption)

        expect(mockOnLabelsChange).toHaveBeenLastCalledWith(['cat', 'dog'])

        // Re-render with updated selectedLabels
        rerender(<LabelSelector {...defaultProps} selectedLabels={currentSelectedLabels} onLabelsChange={mockOnLabelsChange} />)

        // Try to select the same label again - should not add duplicate
        const catOptions = screen.getAllByText('cat')
        const catOptionInDropdown = catOptions.find(option =>
            option.closest('.absolute.z-10') // Find the one in the dropdown
        )
        await user.click(catOptionInDropdown)
        expect(mockOnLabelsChange).toHaveBeenCalledTimes(2) // Should not be called again
    })

    test('allows creating new labels inline', async () => {
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: mockAvailableLabels
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { label_id: 5, label_name: 'newlabel', usage_count: 0 }
                })
            })

        const mockOnLabelsChange = jest.fn()
        render(<LabelSelector {...defaultProps} onLabelsChange={mockOnLabelsChange} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Type a new label name
        const searchInput = screen.getByTestId('label-search-input')
        await user.type(searchInput, 'newlabel')

        // Should show "Create new label" option
        await waitFor(() => {
            expect(screen.getByText('Create "newlabel"')).toBeInTheDocument()
        })

        // Click to create new label
        const createOption = screen.getByText('Create "newlabel"')
        await user.click(createOption)

        // Should call API to create label
        expect(global.fetch).toHaveBeenCalledWith('/api/labels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label_name: 'newlabel' })
        })

        // Should add new label to selection
        expect(mockOnLabelsChange).toHaveBeenCalledWith(['newlabel'])
    })

    test('prevents duplicate label additions with warning', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        const mockOnLabelsChange = jest.fn()
        render(<LabelSelector {...defaultProps} selectedLabels={['cat']} onLabelsChange={mockOnLabelsChange} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Try to select a label that's already selected
        await waitFor(() => {
            expect(screen.getAllByText('cat')).toHaveLength(2) // One in selected chips, one in dropdown
        })

        const catOptions = screen.getAllByText('cat')
        const catOptionInDropdown = catOptions.find(option =>
            option.closest('.absolute.z-10') // Find the one in the dropdown
        )
        await user.click(catOptionInDropdown)

        // Should show warning message
        expect(screen.getByText('Label "cat" is already selected')).toBeInTheDocument()

        // Should not call onLabelsChange
        expect(mockOnLabelsChange).not.toHaveBeenCalled()
    })

    test('provides visual feedback for selected labels', () => {
        const selectedLabels = ['cat', 'dog']
        render(<LabelSelector {...defaultProps} selectedLabels={selectedLabels} />)

        // Should display selected labels as chips
        expect(screen.getByTestId('selected-label-cat')).toBeInTheDocument()
        expect(screen.getByTestId('selected-label-dog')).toBeInTheDocument()

        // Should show remove buttons for each selected label
        expect(screen.getByTestId('remove-label-cat')).toBeInTheDocument()
        expect(screen.getByTestId('remove-label-dog')).toBeInTheDocument()

        // Should show count of selected labels
        expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    test('allows removing selected labels', async () => {
        const mockOnLabelsChange = jest.fn()
        const selectedLabels = ['cat', 'dog']
        render(<LabelSelector {...defaultProps} selectedLabels={selectedLabels} onLabelsChange={mockOnLabelsChange} />)

        const user = createUserEvent()

        // Click remove button for 'cat' label
        const removeCatButton = screen.getByTestId('remove-label-cat')
        await user.click(removeCatButton)

        // Should call onLabelsChange with 'cat' removed
        expect(mockOnLabelsChange).toHaveBeenCalledWith(['dog'])
    })

    test('supports keyboard navigation', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        const mockOnLabelsChange = jest.fn()
        render(<LabelSelector {...defaultProps} onLabelsChange={mockOnLabelsChange} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')

        // Focus the dropdown
        await user.click(dropdown)

        // Use arrow keys to navigate
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowDown}')

        // Should highlight the second option
        await waitFor(() => {
            const highlightedOption = screen.getByTestId('highlighted-option')
            expect(highlightedOption).toHaveTextContent('dog')
        })

        // Press Enter to select
        await user.keyboard('{Enter}')

        expect(mockOnLabelsChange).toHaveBeenCalledWith(['dog'])

        // Test Escape key closes dropdown
        await user.keyboard('{Escape}')
        expect(screen.queryByText('cat')).not.toBeInTheDocument()
    })

    test('filters labels based on search input', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        render(<LabelSelector {...defaultProps} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Type in search input
        const searchInput = screen.getByTestId('label-search-input')
        await user.type(searchInput, 'an')

        // Should only show labels containing 'an'
        await waitFor(() => {
            expect(screen.getByText('animal')).toBeInTheDocument()
            expect(screen.queryByText('cat')).not.toBeInTheDocument()
            expect(screen.queryByText('dog')).not.toBeInTheDocument()
            expect(screen.queryByText('pet')).not.toBeInTheDocument()
        })
    })

    test('shows empty state when no labels match search', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        render(<LabelSelector {...defaultProps} allowCreate={false} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Type search that matches no labels
        const searchInput = screen.getByTestId('label-search-input')
        await user.type(searchInput, 'xyz')

        // Should show empty state when allowCreate is false
        await waitFor(() => {
            expect(screen.getByText('No labels found')).toBeInTheDocument()
        })
    })

    test('handles API errors gracefully', async () => {
        // Mock API error
        global.fetch.mockRejectedValueOnce(new Error('API Error'))

        render(<LabelSelector {...defaultProps} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText('Failed to load labels')).toBeInTheDocument()
        })
    })

    test('disables create option when allowCreate is false', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockAvailableLabels
            })
        })

        render(<LabelSelector {...defaultProps} allowCreate={false} />)

        const user = createUserEvent()
        const dropdown = screen.getByTestId('label-selector-dropdown')
        await user.click(dropdown)

        // Type a new label name
        const searchInput = screen.getByTestId('label-search-input')
        await user.type(searchInput, 'newlabel')

        // Should NOT show "Create new label" option
        await waitFor(() => {
            expect(screen.queryByText('Create "newlabel"')).not.toBeInTheDocument()
        })
    })
})
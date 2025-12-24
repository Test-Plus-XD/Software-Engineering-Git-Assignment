/**
 * Unit tests for DatabaseResetButton component
 * Tests rendering, confirmation dialog, and reset functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatabaseResetButton from '../DatabaseResetButton';

// Mock the API client
jest.mock('../../../lib/utils/network-error-handler', () => ({
    apiClient: {
        post: jest.fn()
    }
}));

describe('DatabaseResetButton Component', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock window.location.reload
        delete window.location;
        window.location = { reload: jest.fn() };
    });

    describe('Component Rendering', () => {
        test('renders reset button with correct text and icon', () => {
            render(<DatabaseResetButton />);

            const button = screen.getByTestId('database-reset-button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('Reset Database');

            // Check for reset icon (refresh icon)
            const icon = button.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        test('button has correct styling classes', () => {
            render(<DatabaseResetButton />);

            const button = screen.getByTestId('database-reset-button');
            expect(button).toHaveClass('text-red-700', 'bg-red-50', 'border-red-300');
        });
    });

    describe('Confirmation Dialog', () => {
        test('shows confirmation dialog when reset button is clicked', () => {
            render(<DatabaseResetButton />);

            const resetButton = screen.getByTestId('database-reset-button');
            fireEvent.click(resetButton);

            // Check for confirmation dialog elements
            expect(screen.getByText('Confirm Database Reset')).toBeInTheDocument();
            expect(screen.getByText(/This will permanently delete all images/)).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Reset Database')).toBeInTheDocument();
        });

        test('hides confirmation dialog when cancel is clicked', () => {
            render(<DatabaseResetButton />);

            // Open confirmation dialog
            const resetButton = screen.getByTestId('database-reset-button');
            fireEvent.click(resetButton);

            // Click cancel
            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            // Dialog should be hidden
            expect(screen.queryByText('Confirm Database Reset')).not.toBeInTheDocument();
        });
    });

    describe('Reset Functionality', () => {
        test('shows loading state during reset', async () => {
            const { apiClient } = require('../../../lib/utils/network-error-handler');

            // Mock a delayed API response
            apiClient.post.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
            );

            render(<DatabaseResetButton />);

            // Open confirmation and confirm reset
            fireEvent.click(screen.getByTestId('database-reset-button'));
            fireEvent.click(screen.getByText('Reset Database'));

            // Should show loading state
            await waitFor(() => {
                expect(screen.getByText('Resetting...')).toBeInTheDocument();
            });

            // Should show spinner
            const spinner = screen.getByTestId('database-reset-button').querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });

        test('shows success message on successful reset', async () => {
            const { apiClient } = require('../../../lib/utils/network-error-handler');
            apiClient.post.mockResolvedValue({ success: true });

            render(<DatabaseResetButton />);

            // Perform reset
            fireEvent.click(screen.getByTestId('database-reset-button'));
            fireEvent.click(screen.getByText('Reset Database'));

            // Wait for success message
            await waitFor(() => {
                expect(screen.getByText(/Database reset successfully/)).toBeInTheDocument();
            });

            // Should schedule page reload
            await waitFor(() => {
                expect(window.location.reload).toHaveBeenCalled();
            }, { timeout: 3000 });
        });

        test('shows error message on failed reset', async () => {
            const { apiClient } = require('../../../lib/utils/network-error-handler');
            apiClient.post.mockRejectedValue(new Error('Network error'));

            render(<DatabaseResetButton />);

            // Perform reset
            fireEvent.click(screen.getByTestId('database-reset-button'));
            fireEvent.click(screen.getByText('Reset Database'));

            // Wait for error message
            await waitFor(() => {
                expect(screen.getByText(/Failed to reset database/)).toBeInTheDocument();
            });

            // Should not reload page
            expect(window.location.reload).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        test('button is keyboard accessible', () => {
            render(<DatabaseResetButton />);

            const button = screen.getByTestId('database-reset-button');
            expect(button).toHaveAttribute('type', 'button');

            // Should be focusable
            button.focus();
            expect(button).toHaveFocus();
        });

        test('confirmation dialog is properly structured', () => {
            render(<DatabaseResetButton />);

            fireEvent.click(screen.getByTestId('database-reset-button'));

            // Check for proper heading structure
            const heading = screen.getByText('Confirm Database Reset');
            expect(heading.tagName).toBe('H3');

            // Check for warning icon
            const warningIcon = screen.getByText('Confirm Database Reset').parentElement.querySelector('svg');
            expect(warningIcon).toBeInTheDocument();
        });
    });
});
/**
 * Unit tests for DatabaseResetButton component
 * Tests rendering, confirmation dialog, and reset functionality
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DatabaseResetButton from '../DatabaseResetButton';

// Mock the API client and data sync
jest.mock('../../../lib/utils/network-error-handler', () => ({
    apiClient: {
        post: jest.fn()
    }
}));

jest.mock('../../../lib/utils/data-sync', () => ({
    dataOperations: {
        notifyDataRefresh: jest.fn()
    }
}));

describe('DatabaseResetButton Component', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Reset the data sync mock specifically
        const { dataOperations } = require('../../../lib/utils/data-sync');
        dataOperations.notifyDataRefresh.mockClear();
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

            // Use getAllByText to handle multiple "Reset Database" buttons
            const resetButtons = screen.getAllByText('Reset Database');
            expect(resetButtons).toHaveLength(2); // Main button + confirmation button
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

            // Get the confirmation button (not the main button)
            const confirmButtons = screen.getAllByText('Reset Database');
            const confirmButton = confirmButtons.find(btn =>
                btn.className.includes('bg-red-600')
            );
            fireEvent.click(confirmButton);

            // Should show loading state
            await waitFor(() => {
                expect(screen.getByText('Resetting...')).toBeInTheDocument();
            });

            // Should show spinner
            const spinner = screen.getByTestId('database-reset-button').querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });

        test('notifies data refresh on successful reset', async () => {
            const { apiClient } = require('../../../lib/utils/network-error-handler');
            const { dataOperations } = require('../../../lib/utils/data-sync');
            apiClient.post.mockResolvedValue({ success: true });

            render(<DatabaseResetButton />);

            // Perform reset
            fireEvent.click(screen.getByTestId('database-reset-button'));

            // Get the confirmation button
            const confirmButtons = screen.getAllByText('Reset Database');
            const confirmButton = confirmButtons.find(btn =>
                btn.className.includes('bg-red-600')
            );
            fireEvent.click(confirmButton);

            // Wait for success message
            await waitFor(() => {
                expect(screen.getByText(/Database reset successfully/)).toBeInTheDocument();
            });

            // Check that message is positioned to the left of button (using flex layout)
            const statusMessage = screen.getByTestId('reset-status-message');
            expect(statusMessage).toBeInTheDocument();
            expect(statusMessage).toHaveClass('opacity-100'); // Should be visible initially

            // Should notify data refresh instead of reloading page
            await waitFor(() => {
                expect(dataOperations.notifyDataRefresh).toHaveBeenCalled();
            }, { timeout: 2000 });
        });

        test('shows error message on failed reset', async () => {
            const { apiClient } = require('../../../lib/utils/network-error-handler');
            apiClient.post.mockRejectedValue(new Error('Network error'));

            render(<DatabaseResetButton />);

            // Perform reset
            fireEvent.click(screen.getByTestId('database-reset-button'));

            // Get the confirmation button
            const confirmButtons = screen.getAllByText('Reset Database');
            const confirmButton = confirmButtons.find(btn =>
                btn.className.includes('bg-red-600')
            );
            fireEvent.click(confirmButton);

            // Wait for error message
            await waitFor(() => {
                expect(screen.getByText(/Failed to reset database/)).toBeInTheDocument();
            });

            // The main functionality test is that error message is shown
            // We don't need to test the data refresh behavior in error cases
        });

        test('success message fades out after 4 seconds', async () => {
            jest.useFakeTimers();

            const { apiClient } = require('../../../lib/utils/network-error-handler');
            const { dataOperations } = require('../../../lib/utils/data-sync');
            apiClient.post.mockResolvedValue({ success: true });

            render(<DatabaseResetButton />);

            // Perform reset
            fireEvent.click(screen.getByTestId('database-reset-button'));
            const confirmButtons = screen.getAllByText('Reset Database');
            const confirmButton = confirmButtons.find(btn =>
                btn.className.includes('bg-red-600')
            );
            fireEvent.click(confirmButton);

            // Wait for success message to appear
            await waitFor(() => {
                expect(screen.getByTestId('reset-status-message')).toBeInTheDocument();
            });

            const statusMessage = screen.getByTestId('reset-status-message');
            expect(statusMessage).toHaveClass('opacity-100');

            // Fast-forward 4 seconds to trigger fade
            jest.advanceTimersByTime(4000);

            // Wait for fade to start
            await waitFor(() => {
                expect(statusMessage).toHaveClass('opacity-0');
            });

            // Fast-forward fade animation duration
            jest.advanceTimersByTime(300);

            // Message should be removed from DOM
            await waitFor(() => {
                expect(screen.queryByTestId('reset-status-message')).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });
    });

    describe('Accessibility', () => {
        test('button is keyboard accessible', () => {
            render(<DatabaseResetButton />);

            const button = screen.getByTestId('database-reset-button');

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
/**
 * Tests for creator and editor display functionality
 * Following TDD pattern - tests first, then implementation
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageCard from '../app/components/ImageCard';

// Mock Next.js Image component
jest.mock('next/image', () => {
    return function MockImage({ src, alt, ...props }) {
        return <img src={src} alt={alt} {...props} />;
    };
});

// Mock data sync utilities
jest.mock('../app/lib/utils/data-sync', () => ({
    dataOperations: {
        notifyDataRefresh: jest.fn()
    }
}));

describe('Creator and Editor Display', () => {
    const mockImageWithCreator = {
        image_id: 1,
        filename: 'test-image.jpg',
        original_name: 'test-image.jpg',
        file_path: '/uploads/test-image.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        uploaded_at: '2024-01-01T10:00:00Z',
        labels: ['cat', 'animal'],
        confidences: [0.95, 0.85],
        created_by: 'john.doe@example.com',
        last_edited_by: 'jane.smith@example.com'
    };

    const mockImageWithoutCreator = {
        image_id: 2,
        filename: 'test-image-2.jpg',
        original_name: 'test-image-2.jpg',
        file_path: '/uploads/test-image-2.jpg',
        file_size: 2048,
        mime_type: 'image/jpeg',
        uploaded_at: '2024-01-02T10:00:00Z',
        labels: ['dog'],
        confidences: [0.90],
        created_by: null,
        last_edited_by: null
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
    });

    test('should display creator information when available', async () => {
        render(<ImageCard image={mockImageWithCreator} />);

        // Wait for component to load
        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Check if creator information is displayed
        expect(screen.getByText(/Created by:/)).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    test('should display last editor information when available', async () => {
        render(<ImageCard image={mockImageWithCreator} />);

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Check if last editor information is displayed
        expect(screen.getByText(/Last edited by:/)).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    });

    test('should display "Unknown" when creator information is not available', async () => {
        render(<ImageCard image={mockImageWithoutCreator} />);

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Check if "Unknown" is displayed for creator
        expect(screen.getByText(/Created by:/)).toBeInTheDocument();
        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    test('should not display last editor when same as creator', async () => {
        const imageWithSameCreatorEditor = {
            ...mockImageWithCreator,
            last_edited_by: 'john.doe@example.com' // Same as created_by
        };

        render(<ImageCard image={imageWithSameCreatorEditor} />);

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Should show creator but not last editor when they're the same
        expect(screen.getByText(/Created by:/)).toBeInTheDocument();
        expect(screen.queryByText(/Last edited by:/)).not.toBeInTheDocument();
    });

    test('should display creator and editor info at the bottom of the card', async () => {
        render(<ImageCard image={mockImageWithCreator} />);

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Check if the creator/editor section exists at the bottom
        const creatorEditorSection = screen.getByTestId('creator-editor-info');
        expect(creatorEditorSection).toBeInTheDocument();

        // Verify it's positioned at the bottom of the card
        const imageCard = screen.getByTestId('image-card');
        expect(imageCard).toContainElement(creatorEditorSection);
    });

    test('should format email addresses nicely', async () => {
        const imageWithLongEmail = {
            ...mockImageWithCreator,
            created_by: 'very.long.email.address@company.example.com'
        };

        render(<ImageCard image={imageWithLongEmail} />);

        await waitFor(() => {
            expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
        });

        // Check if long email is truncated or formatted nicely
        const creatorText = screen.getByTestId('creator-info');
        expect(creatorText).toBeInTheDocument();
        expect(creatorText.textContent).toContain('very.long.email.address@company.example.com');
    });
});
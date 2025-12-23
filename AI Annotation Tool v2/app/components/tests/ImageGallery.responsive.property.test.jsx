/**
 * Property-based tests for ImageGallery responsive grid layout
 * **Feature: phase-5-react-frontend, Property 1: Responsive grid layout adaptation**
 * **Validates: Requirements 1.1, 6.1, 6.2, 6.3**
 */

import { render, screen, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import ImageGallery from '../ImageGallery';

describe('ImageGallery Responsive Grid Layout Properties', () => {
    afterEach(() => {
        cleanup();
    });

    /**
     * Property 1: Responsive grid layout adaptation
     * For any viewport size, the ImageGallery component should display 
     * the appropriate number of columns (1 for mobile, 2 for tablet, 3+ for desktop)
     * **Validates: Requirements 1.1, 6.1, 6.2, 6.3**
     */
    test('Property 1: Responsive grid layout adaptation', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        image_id: fc.integer({ min: 1, max: 1000 }),
                        filename: fc.string({ minLength: 5, maxLength: 20 }),
                        original_name: fc.string({ minLength: 5, maxLength: 20 }),
                        file_path: fc.webUrl(),
                        file_size: fc.integer({ min: 1024, max: 10485760 }),
                        mime_type: fc.constantFrom('image/jpeg', 'image/png'),
                        uploaded_at: fc.date().map(d => d.toISOString()),
                        labels: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { maxLength: 5 }),
                        confidences: fc.array(fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }), { maxLength: 5 }),
                        label_count: fc.integer({ min: 0, max: 5 })
                    }),
                    { minLength: 1, maxLength: 5 } // Ensure at least 1 image, max 5 for performance
                ),
                (images) => {
                    // Ensure unique image_ids to avoid React key warnings
                    const uniqueImages = images.map((image, index) => ({
                        ...image,
                        image_id: index + 1 // Ensure unique IDs
                    }));

                    const mockProps = {
                        images: uniqueImages,
                        pagination: {
                            page: 1,
                            limit: 10,
                            totalImages: uniqueImages.length,
                            totalPages: Math.ceil(uniqueImages.length / 10),
                            hasNextPage: uniqueImages.length > 10,
                            hasPrevPage: false
                        }
                    };

                    const { unmount } = render(<ImageGallery {...mockProps} />);

                    try {
                        const gridContainer = screen.getByTestId('image-gallery-grid');

                        // Verify responsive grid classes are present
                        expect(gridContainer).toHaveClass('grid');
                        expect(gridContainer).toHaveClass('grid-cols-1');
                        expect(gridContainer).toHaveClass('md:grid-cols-2');
                        expect(gridContainer).toHaveClass('lg:grid-cols-3');

                        // Verify gap and margin classes
                        expect(gridContainer).toHaveClass('gap-6');
                        expect(gridContainer).toHaveClass('mb-8');
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 20 } // Reduce number of runs for performance and stability
        );
    });
});
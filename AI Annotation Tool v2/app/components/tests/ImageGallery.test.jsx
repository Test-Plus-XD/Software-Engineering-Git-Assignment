/**
 * Unit tests for ImageGallery component
 * Tests rendering, empty states, pagination, and responsive layout
 */

import { render, screen, waitFor } from '@testing-library/react';
import ImageGallery from '../ImageGallery';

// Mock Next.js Image component
jest.mock('next/image', () => {
    return function MockImage({ src, alt, ...props }) {
        return <img src={src} alt={alt} {...props} />;
    };
});

describe('ImageGallery Component', () => {
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
    ];

    describe('Component Import', () => {
        test('successfully imports and renders ImageGallery component', () => {
            // This test should pass now that ImageGallery component is implemented
            expect(() => {
                render(<ImageGallery />);
            }).not.toThrow();
        });
    });

    describe('Grid Rendering (will fail until component is implemented)', () => {
        test('should render grid of ImageCard components', async () => {
            // Mock props for when component is implemented
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
            };

            // This will fail until component is implemented
            render(<ImageGallery {...mockProps} />);

            // Wait for images to load
            await waitFor(() => {
                expect(screen.getByAltText('test1.jpg')).toBeInTheDocument();
                expect(screen.getByAltText('test2.jpg')).toBeInTheDocument();
            });

            // Check that ImageCard components are rendered
            const imageCards = screen.getAllByRole('img');
            expect(imageCards).toHaveLength(2);

            // Check that labels are displayed
            expect(screen.getByText('cat')).toBeInTheDocument();
            expect(screen.getByText('animal')).toBeInTheDocument();
            expect(screen.getByText('dog')).toBeInTheDocument();
        });

        test('should display empty state when no images', async () => {
            const emptyProps = {
                images: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalImages: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };

            render(<ImageGallery {...emptyProps} />);

            await waitFor(() => {
                expect(screen.getByText(/no images found/i)).toBeInTheDocument();
            });

            // Should not render any image cards
            const imageCards = screen.queryAllByRole('img');
            expect(imageCards).toHaveLength(0);
        });
    });

    describe('Pagination (will fail until component is implemented)', () => {
        test('should handle pagination with page controls', async () => {
            const paginatedProps = {
                images: mockImages,
                pagination: {
                    page: 1,
                    limit: 1,
                    totalImages: 2,
                    totalPages: 2,
                    hasNextPage: true,
                    hasPrevPage: false
                }
            };

            render(<ImageGallery {...paginatedProps} />);

            await waitFor(() => {
                // Should show pagination controls
                expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
            });
        });

        test('should show correct pagination state for middle page', async () => {
            const middlePageProps = {
                images: mockImages,
                pagination: {
                    page: 2,
                    limit: 1,
                    totalImages: 3,
                    totalPages: 3,
                    hasNextPage: true,
                    hasPrevPage: true
                }
            };

            render(<ImageGallery {...middlePageProps} />);

            await waitFor(() => {
                expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
                expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
            });
        });
    });

    describe('Responsive Layout (will fail until component is implemented)', () => {
        test('should apply responsive grid classes', async () => {
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
            };

            render(<ImageGallery {...mockProps} />);

            await waitFor(() => {
                const gridContainer = screen.getByTestId('image-gallery-grid');

                // Should have responsive grid classes
                expect(gridContainer).toHaveClass('grid');
                expect(gridContainer).toHaveClass('grid-cols-1'); // mobile
                expect(gridContainer).toHaveClass('md:grid-cols-2'); // tablet
                expect(gridContainer).toHaveClass('lg:grid-cols-3'); // desktop
            });
        });

        test('should maintain grid structure with different numbers of images', async () => {
            const singleImageProps = {
                images: [mockImages[0]],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalImages: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };

            render(<ImageGallery {...singleImageProps} />);

            await waitFor(() => {
                const gridContainer = screen.getByTestId('image-gallery-grid');
                expect(gridContainer).toHaveClass('grid');

                // Should still have responsive classes even with one image
                expect(gridContainer).toHaveClass('grid-cols-1');
                expect(gridContainer).toHaveClass('md:grid-cols-2');
                expect(gridContainer).toHaveClass('lg:grid-cols-3');
            });
        });
    });

    describe('Loading States (will fail until component is implemented)', () => {
        test('should show loading state while fetching images', () => {
            const loadingProps = {
                images: null, // null indicates loading
                pagination: null,
                // Force loading state for test
                loading: true
            };

            render(<ImageGallery {...loadingProps} />);

            // Should show loading state initially
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });
    });

    describe('Error Handling (will fail until component is implemented)', () => {
        test('should handle errors gracefully', async () => {
            const errorProps = {
                images: null,
                pagination: null,
                error: 'Failed to load images'
            };

            render(<ImageGallery {...errorProps} />);

            await waitFor(() => {
                expect(screen.getByText(/error loading images/i)).toBeInTheDocument();
            });
        });
    });
});
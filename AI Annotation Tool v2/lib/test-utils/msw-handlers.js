import { http, HttpResponse } from 'msw'

// Mock data for testing
const mockImages = [
    {
        image_id: 1,
        filename: 'test-image-1.jpg',
        original_name: 'test-image-1.jpg',
        file_path: 'https://firebasestorage.googleapis.com/test-image-1.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        uploaded_at: '2024-01-01T00:00:00.000Z',
        labels: ['cat', 'animal'],
        confidences: [0.95, 0.88],
        label_count: 2
    },
    {
        image_id: 2,
        filename: 'test-image-2.png',
        original_name: 'test-image-2.png',
        file_path: 'https://firebasestorage.googleapis.com/test-image-2.png',
        file_size: 2048000,
        mime_type: 'image/png',
        uploaded_at: '2024-01-02T00:00:00.000Z',
        labels: ['dog', 'animal', 'outdoor'],
        confidences: [0.92, 0.85, 0.78],
        label_count: 3
    }
]

const mockLabels = [
    {
        label_id: 1,
        label_name: 'cat',
        label_description: 'Feline animal',
        created_at: '2024-01-01T00:00:00.000Z',
        usage_count: 5
    },
    {
        label_id: 2,
        label_name: 'dog',
        label_description: 'Canine animal',
        created_at: '2024-01-01T00:00:00.000Z',
        usage_count: 3
    },
    {
        label_id: 3,
        label_name: 'animal',
        label_description: 'General animal category',
        created_at: '2024-01-01T00:00:00.000Z',
        usage_count: 8
    }
]

export const handlers = [
    // GET /api/images - Get all images with pagination
    http.get('/api/images', ({ request }) => {
        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page')) || 1
        const limit = parseInt(url.searchParams.get('limit')) || 10

        const totalImages = mockImages.length
        const totalPages = Math.ceil(totalImages / limit)
        const offset = (page - 1) * limit
        const paginatedImages = mockImages.slice(offset, offset + limit)

        return HttpResponse.json({
            success: true,
            data: paginatedImages,
            pagination: {
                page,
                limit,
                totalImages,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        })
    }),

    // POST /api/images - Create new image
    http.post('/api/images', async ({ request }) => {
        const contentType = request.headers.get('content-type') || ''

        if (contentType.includes('multipart/form-data')) {
            // Mock file upload
            const newImage = {
                image_id: mockImages.length + 1,
                filename: 'uploaded-image.jpg',
                original_name: 'uploaded-image.jpg',
                file_path: 'https://firebasestorage.googleapis.com/uploaded-image.jpg',
                file_size: 1500000,
                mime_type: 'image/jpeg',
                uploaded_at: new Date().toISOString(),
                labels: [],
                confidences: [],
                label_count: 0
            }

            mockImages.push(newImage)

            return HttpResponse.json({
                success: true,
                data: newImage,
                firebaseUrl: newImage.file_path
            }, { status: 201 })
        }

        // Mock JSON creation
        const body = await request.json()
        const newImage = {
            image_id: mockImages.length + 1,
            ...body,
            uploaded_at: new Date().toISOString(),
            labels: [],
            confidences: [],
            label_count: 0
        }

        mockImages.push(newImage)

        return HttpResponse.json({
            success: true,
            data: newImage
        }, { status: 201 })
    }),

    // GET /api/labels - Get all labels
    http.get('/api/labels', () => {
        return HttpResponse.json({
            success: true,
            data: mockLabels
        })
    }),

    // POST /api/labels - Create new label
    http.post('/api/labels', async ({ request }) => {
        const body = await request.json()
        const newLabel = {
            label_id: mockLabels.length + 1,
            label_name: body.label_name,
            label_description: body.label_description || null,
            created_at: new Date().toISOString(),
            usage_count: 0
        }

        mockLabels.push(newLabel)

        return HttpResponse.json({
            success: true,
            data: newLabel
        }, { status: 201 })
    }),

    // Error handlers for testing error states
    http.get('/api/images/error', () => {
        return HttpResponse.json({
            success: false,
            error: 'Failed to fetch images',
            details: 'Network error'
        }, { status: 500 })
    }),

    http.post('/api/images/error', () => {
        return HttpResponse.json({
            success: false,
            error: 'Failed to upload image',
            details: 'Upload failed'
        }, { status: 500 })
    })
]

export { mockImages, mockLabels }
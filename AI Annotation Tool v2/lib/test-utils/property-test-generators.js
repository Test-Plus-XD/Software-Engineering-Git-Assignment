import fc from 'fast-check'

// Generator for mock image data
export const imageDataGenerator = () => fc.record({
    image_id: fc.integer({ min: 1, max: 1000 }),
    filename: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.jpg`),
    original_name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.jpg`),
    file_path: fc.webUrl().map(url => `${url}/image.jpg`),
    file_size: fc.integer({ min: 1000, max: 10000000 }),
    mime_type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
    uploaded_at: fc.date().map(d => d.toISOString()),
    labels: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
    confidences: fc.array(fc.float({ min: 0, max: 1 }), { minLength: 0, maxLength: 10 }),
    label_count: fc.integer({ min: 0, max: 10 })
})

// Generator for label data
export const labelDataGenerator = () => fc.record({
    label_id: fc.integer({ min: 1, max: 1000 }),
    label_name: fc.string({ minLength: 2, maxLength: 30 }),
    label_description: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    created_at: fc.date().map(d => d.toISOString()),
    usage_count: fc.integer({ min: 0, max: 100 })
})

// Generator for file upload data
export const fileUploadGenerator = () => fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.jpg`),
    size: fc.integer({ min: 1000, max: 10000000 }),
    type: fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp'),
    lastModified: fc.date().map(d => d.getTime())
})

// Generator for invalid file types
export const invalidFileGenerator = () => fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.txt`),
    size: fc.integer({ min: 100, max: 1000 }),
    type: fc.constantFrom('text/plain', 'application/pdf', 'video/mp4', 'audio/mp3'),
    lastModified: fc.date().map(d => d.getTime())
})

// Generator for oversized files
export const oversizedFileGenerator = () => fc.record({
    name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.jpg`),
    size: fc.integer({ min: 15000000, max: 50000000 }), // 15MB+
    type: fc.constantFrom('image/jpeg', 'image/png'),
    lastModified: fc.date().map(d => d.getTime())
})

// Generator for viewport dimensions
export const viewportGenerator = () => fc.record({
    width: fc.integer({ min: 320, max: 2560 }),
    height: fc.integer({ min: 568, max: 1440 })
})

// Generator for mobile viewport dimensions
export const mobileViewportGenerator = () => fc.record({
    width: fc.integer({ min: 320, max: 767 }),
    height: fc.integer({ min: 568, max: 1024 })
})

// Generator for tablet viewport dimensions
export const tabletViewportGenerator = () => fc.record({
    width: fc.integer({ min: 768, max: 1023 }),
    height: fc.integer({ min: 768, max: 1366 })
})

// Generator for desktop viewport dimensions
export const desktopViewportGenerator = () => fc.record({
    width: fc.integer({ min: 1024, max: 2560 }),
    height: fc.integer({ min: 768, max: 1440 })
})

// Generator for form validation test data
export const formValidationGenerator = () => fc.record({
    validInput: fc.string({ minLength: 1, maxLength: 100 }),
    invalidInput: fc.constantFrom('', '   ', null, undefined),
    email: fc.emailAddress(),
    invalidEmail: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
    number: fc.integer({ min: 0, max: 1000 }),
    invalidNumber: fc.constantFrom(-1, 1001, 'not-a-number', null)
})

// Generator for API error responses
export const apiErrorGenerator = () => fc.record({
    success: fc.constant(false),
    error: fc.string({ minLength: 10, maxLength: 100 }),
    details: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    status: fc.constantFrom(400, 401, 403, 404, 500, 502, 503)
})

// Generator for pagination data
export const paginationGenerator = () => fc.record({
    page: fc.integer({ min: 1, max: 100 }),
    limit: fc.integer({ min: 1, max: 50 }),
    totalItems: fc.integer({ min: 0, max: 1000 })
}).map(({ page, limit, totalItems }) => ({
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    hasNextPage: page < Math.ceil(totalItems / limit),
    hasPrevPage: page > 1
}))

// Generator for touch interaction data
export const touchInteractionGenerator = () => fc.record({
    clientX: fc.integer({ min: 0, max: 1920 }),
    clientY: fc.integer({ min: 0, max: 1080 }),
    touches: fc.array(fc.record({
        clientX: fc.integer({ min: 0, max: 1920 }),
        clientY: fc.integer({ min: 0, max: 1080 }),
        identifier: fc.integer({ min: 0, max: 10 })
    }), { minLength: 1, maxLength: 5 })
})

// Generator for network delay simulation
export const networkDelayGenerator = () => fc.integer({ min: 100, max: 5000 })

// Generator for upload progress data
export const uploadProgressGenerator = () => fc.record({
    loaded: fc.integer({ min: 0, max: 10000000 }),
    total: fc.integer({ min: 1000000, max: 10000000 })
}).map(({ loaded, total }) => ({
    loaded: Math.min(loaded, total),
    total,
    percentage: Math.round((Math.min(loaded, total) / total) * 100)
}))
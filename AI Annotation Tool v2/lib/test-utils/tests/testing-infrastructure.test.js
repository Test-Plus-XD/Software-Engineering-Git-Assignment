/**
 * Test to verify testing infrastructure is properly set up
 */

import { render, screen } from '../testing-library-utils'
import fc from 'fast-check'
import { imageDataGenerator } from '../property-test-generators'

describe('Testing Infrastructure', () => {
    test('React Testing Library works correctly', () => {
        render(<div data-testid="test-element">Hello Testing</div>)
        expect(screen.getByTestId('test-element')).toBeInTheDocument()
        expect(screen.getByText('Hello Testing')).toBeInTheDocument()
    })

    test('Property-based testing with fast-check works', () => {
        fc.assert(
            fc.property(imageDataGenerator(), (imageData) => {
                // Test that generated image data has required properties
                expect(imageData).toHaveProperty('image_id')
                expect(imageData).toHaveProperty('filename')
                expect(imageData).toHaveProperty('file_path')
                expect(imageData.image_id).toBeGreaterThan(0)
                expect(imageData.filename).toMatch(/\.jpg$/)
                expect(imageData.labels).toBeInstanceOf(Array)
                expect(imageData.confidences).toBeInstanceOf(Array)
                expect(imageData.label_count).toBeGreaterThanOrEqual(0)
            }),
            { numRuns: 10 } // Reduced for infrastructure test
        )
    })

    test('Jest DOM matchers are available', () => {
        render(<button disabled>Test Button</button>)
        const button = screen.getByRole('button')

        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
        expect(button).toHaveTextContent('Test Button')
    })

    test('Mock utilities work correctly', () => {
        // Test that our mocks are properly set up
        expect(global.ResizeObserver).toBeDefined()
        expect(global.IntersectionObserver).toBeDefined()
        expect(window.matchMedia).toBeDefined()
        expect(global.File).toBeDefined()
        expect(global.FileReader).toBeDefined()
    })

    test('Testing utilities work correctly', () => {
        const { createMockImageFile, createMockInvalidFile } = require('../testing-library-utils')

        const validFile = createMockImageFile()
        expect(validFile.name).toMatch(/\.jpg$/)
        expect(validFile.type).toBe('image/jpeg')

        const invalidFile = createMockInvalidFile()
        expect(invalidFile.name).toMatch(/\.txt$/)
        expect(invalidFile.type).toBe('text/plain')
    })
})
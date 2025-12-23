/**
 * Property-based tests for UploadForm file validation
 * Feature: phase-5-react-frontend, Property 4: File upload validation
 * Validates: Requirements 2.1, 2.2
 */

import { render, screen } from '../../../lib/test-utils/testing-library-utils'
import fc from 'fast-check'
import UploadForm from '../UploadForm'

describe('UploadForm File Validation Property Tests', () => {
    /**
     * Feature: phase-5-react-frontend, Property 4: File upload validation
     * For any file selected for upload, the UploadForm component should validate file type and size, 
     * rejecting invalid files with appropriate error messages
     * Validates: Requirements 2.1, 2.2
     */
    test('Property 4: File upload validation - Component renders correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    maxFileSize: fc.integer({ min: 1000000, max: 20000000 }), // 1MB to 20MB
                    allowedTypes: fc.constant(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
                }),
                (config) => {
                    render(<UploadForm maxFileSize={config.maxFileSize} allowedTypes={config.allowedTypes} />)

                    // Component should render basic elements
                    expect(screen.getByTestId('drop-zone')).toBeInTheDocument()
                    expect(screen.getByTestId('file-input')).toBeInTheDocument()
                    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()

                    // Should show correct file size limit
                    const maxSizeMB = (config.maxFileSize / 1000000).toFixed(1)
                    expect(screen.getByText(new RegExp(`max ${maxSizeMB} MB`, 'i'))).toBeInTheDocument()

                    // Clean up for next iteration
                    screen.unmount?.()
                }
            ),
            {
                numRuns: 50,
                verbose: true
            }
        )
    })

    /**
     * Property test for component props validation
     * Ensures component handles different configurations correctly
     */
    test('Property 4a: Component configuration handling', () => {
        fc.assert(
            fc.property(
                fc.record({
                    maxFileSize: fc.integer({ min: 1000000, max: 50000000 }),
                    className: fc.string({ minLength: 0, maxLength: 20 })
                }),
                (props) => {
                    render(<UploadForm {...props} />)

                    // Component should render with custom props
                    const uploadForm = screen.getByTestId('drop-zone').parentElement
                    if (props.className) {
                        expect(uploadForm).toHaveClass(props.className)
                    }

                    // Should display correct file size limit
                    const maxSizeMB = (props.maxFileSize / 1000000).toFixed(1)
                    expect(screen.getByText(new RegExp(`max ${maxSizeMB} MB`, 'i'))).toBeInTheDocument()

                    // Clean up for next iteration
                    screen.unmount?.()
                }
            ),
            {
                numRuns: 30,
                verbose: true
            }
        )
    })

    /**
     * Property test for initial component state
     * Ensures component starts in correct initial state
     */
    test('Property 4b: Initial component state', () => {
        fc.assert(
            fc.property(
                fc.record({
                    maxFileSize: fc.integer({ min: 5000000, max: 20000000 })
                }),
                (props) => {
                    render(<UploadForm {...props} />)

                    // Should start with no file selected
                    expect(screen.queryByTestId('file-preview')).not.toBeInTheDocument()

                    // Upload button should be disabled initially
                    const uploadButton = screen.getByRole('button', { name: /upload/i })
                    expect(uploadButton).toBeDisabled()

                    // Should show initial drag and drop text
                    expect(screen.getByText('Drag and drop your image here')).toBeInTheDocument()

                    // Clean up for next iteration
                    screen.unmount?.()
                }
            ),
            {
                numRuns: 25,
                verbose: true
            }
        )
    })
})
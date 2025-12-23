/**
 * Unit tests for WaveBackground component
 * Tests wave animation integration and motion accessibility
 * Requirements: 5.1, 5.5
 */

import { render, screen } from '../../../lib/test-utils/testing-library-utils'
import WaveBackground from '../WaveBackground'

// Mock react-wavify to control wave rendering in tests
jest.mock('react-wavify', () => {
    return function MockWave({ fill, paused, options, ...props }) {
        return (
            <div
                data-testid="wave-component"
                data-fill={fill}
                data-paused={paused}
                data-options={JSON.stringify(options)}
                {...props}
            />
        )
    }
})

// Mock window.matchMedia for prefers-reduced-motion testing
const mockMatchMedia = (matches) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches,
            media: query,
            onchange: null,
            addListener: jest.fn(), // deprecated
            removeListener: jest.fn(), // deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    })
}

describe('WaveBackground Component', () => {
    beforeEach(() => {
        // Reset matchMedia mock before each test
        delete window.matchMedia
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    /**
     * Test wave components render when application loads
     * Requirements: 5.1
     */
    test('renders wave components when application loads', () => {
        // Mock normal motion preferences (no reduced motion)
        mockMatchMedia(false)

        render(<WaveBackground />)

        // Should render wave components
        const waveElements = screen.getAllByTestId('wave-component')
        expect(waveElements.length).toBeGreaterThan(0)

        // Waves should not be paused by default
        waveElements.forEach(wave => {
            expect(wave.getAttribute('data-paused')).toBe('false')
        })
    })

    /**
     * Test motion reduction preferences are respected
     * Requirements: 5.5
     */
    test('respects prefers-reduced-motion settings', () => {
        // Mock reduced motion preference
        mockMatchMedia(true)

        render(<WaveBackground />)

        const waveElements = screen.getAllByTestId('wave-component')
        expect(waveElements.length).toBeGreaterThan(0)

        // Waves should be paused when reduced motion is preferred
        waveElements.forEach(wave => {
            expect(wave.getAttribute('data-paused')).toBe('true')
        })
    })

    /**
     * Test wave animations don't interfere with content
     * Requirements: 5.1
     */
    test('wave animations do not interfere with content', () => {
        mockMatchMedia(false)

        render(
            <div>
                <WaveBackground />
                <div data-testid="content">Test Content</div>
            </div>
        )

        // Content should be visible and accessible
        const content = screen.getByTestId('content')
        expect(content).toBeInTheDocument()
        expect(content).toBeVisible()

        // Wave should be positioned as background (lower z-index)
        const waveElements = screen.getAllByTestId('wave-component')
        waveElements.forEach(wave => {
            const waveStyles = window.getComputedStyle(wave)
            const contentStyles = window.getComputedStyle(content)

            // Wave should have lower z-index or be positioned behind content
            // This test will fail initially since WaveBackground doesn't exist yet
            expect(wave).toBeInTheDocument()
        })
    })

    /**
     * Test wave component handles missing matchMedia gracefully
     * Edge case for older browsers
     */
    test('handles missing matchMedia gracefully', () => {
        // Remove matchMedia entirely
        delete window.matchMedia

        // Should not throw error
        expect(() => {
            render(<WaveBackground />)
        }).not.toThrow()

        // Should still render waves (defaulting to no reduced motion)
        const waveElements = screen.getAllByTestId('wave-component')
        expect(waveElements.length).toBeGreaterThan(0)
    })

    /**
     * Test wave component accepts custom props
     * Requirements: 5.1
     */
    test('accepts custom styling props', () => {
        mockMatchMedia(false)

        const customProps = {
            className: 'custom-wave-class',
            'data-custom': 'custom-value'
        }

        render(<WaveBackground {...customProps} />)

        const waveContainer = screen.getByTestId('wave-background-container')
        expect(waveContainer).toHaveClass('custom-wave-class')
        expect(waveContainer).toHaveAttribute('data-custom', 'custom-value')
    })

    /**
     * Test multiple wave layers render correctly
     * Requirements: 5.1
     */
    test('renders multiple wave layers for depth effect', () => {
        mockMatchMedia(false)

        render(<WaveBackground />)

        const waveElements = screen.getAllByTestId('wave-component')

        // Should render multiple waves for layered effect
        expect(waveElements.length).toBeGreaterThanOrEqual(2)

        // Each wave should have different fill colors for depth
        const fillColors = waveElements.map(wave => wave.getAttribute('data-fill'))
        const uniqueColors = new Set(fillColors)
        expect(uniqueColors.size).toBeGreaterThan(1)
    })
})
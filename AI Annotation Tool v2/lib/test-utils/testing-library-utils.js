import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function that includes common providers
const customRender = (ui, options = {}) => {
    const AllTheProviders = ({ children }) => {
        return (
            <div>
                {children}
            </div>
        )
    }

    return render(ui, { wrapper: AllTheProviders, ...options })
}

// Utility to create user event instance
export const createUserEvent = () => userEvent.setup()

// Utility to wait for loading states to complete
export const waitForLoadingToFinish = async () => {
    const { waitForElementToBeRemoved } = await import('@testing-library/react')
    try {
        await waitForElementToBeRemoved(
            () => document.querySelector('[data-testid="loading"]'),
            { timeout: 3000 }
        )
    } catch (error) {
        // Loading element might not exist, which is fine
    }
}

// Utility to create mock image files for upload testing
export const createMockImageFile = (name = 'test-image.jpg', size = 1024000, type = 'image/jpeg') => {
    const file = new File(['mock image content'], name, { type, size })
    return file
}

// Utility to create mock invalid files for validation testing
export const createMockInvalidFile = (name = 'test.txt', size = 1024, type = 'text/plain') => {
    const file = new File(['mock text content'], name, { type, size })
    return file
}

// Utility to create mock oversized files
export const createMockOversizedFile = (name = 'large-image.jpg', size = 15 * 1024 * 1024, type = 'image/jpeg') => {
    const file = new File(['mock large image content'], name, { type, size })
    return file
}

// Utility to simulate viewport changes for responsive testing
export const setViewport = (width, height) => {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
}

// Utility to mock prefers-reduced-motion
export const mockPrefersReducedMotion = (value = true) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => {
            if (query === '(prefers-reduced-motion: reduce)') {
                return {
                    matches: value,
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                }
            }
            return {
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        }),
    })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { customRender as render }
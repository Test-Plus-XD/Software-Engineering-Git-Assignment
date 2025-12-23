import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill TextEncoder/TextDecoder for Node.js
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock BroadcastChannel for MSW
global.BroadcastChannel = class MockBroadcastChannel {
    constructor(name) {
        this.name = name
    }
    postMessage() { }
    close() { }
    addEventListener() { }
    removeEventListener() { }
}

// Mock WritableStream for MSW
global.WritableStream = class MockWritableStream {
    constructor() {
        this.locked = false
    }
    getWriter() {
        return {
            write: jest.fn(),
            close: jest.fn(),
            abort: jest.fn(),
        }
    }
}

// Mock ReadableStream for MSW
global.ReadableStream = class MockReadableStream {
    constructor() {
        this.locked = false
    }
    getReader() {
        return {
            read: jest.fn().mockResolvedValue({ done: true }),
            cancel: jest.fn(),
        }
    }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        }
    },
    useSearchParams() {
        return new URLSearchParams()
    },
    usePathname() {
        return '/'
    },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} />
    },
}))

// Mock react-wavify
jest.mock('react-wavify', () => ({
    __esModule: true,
    default: ({ children, ...props }) => <div data-testid="wave" {...props}>{children}</div>,
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock File and FileReader for upload tests
global.File = class MockFile {
    constructor(parts, filename, properties) {
        this.parts = parts
        this.name = filename
        this.size = parts.reduce((acc, part) => acc + part.length, 0)
        this.type = properties?.type || 'text/plain'
        this.lastModified = Date.now()
    }
}

global.FileReader = class MockFileReader {
    constructor() {
        this.readyState = 0
        this.result = null
        this.error = null
    }

    readAsDataURL(file) {
        setTimeout(() => {
            this.readyState = 2
            this.result = `data:${file.type};base64,mock-base64-data`
            if (this.onload) this.onload({ target: this })
        }, 0)
    }

    readAsText(file) {
        setTimeout(() => {
            this.readyState = 2
            this.result = file.parts.join('')
            if (this.onload) this.onload({ target: this })
        }, 0)
    }
}
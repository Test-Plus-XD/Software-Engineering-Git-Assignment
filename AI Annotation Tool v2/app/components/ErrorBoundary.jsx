'use client'

import React from 'react'

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * Provides different fallback UIs based on error type and allows recovery
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error: error,
            errorId: Date.now() // Unique ID for this error instance
        }
    }

    componentDidCatch(error, errorInfo) {
        // Log error details for debugging
        console.error('Error Boundary caught an error:', error, errorInfo)

        this.setState({
            error: error,
            errorInfo: errorInfo
        })

        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            this.logErrorToService(error, errorInfo)
        }
    }

    logErrorToService = (error, errorInfo) => {
        // In a real app, this would send to an error tracking service like Sentry
        console.log('Logging error to service:', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        })
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        })
    }

    handleReload = () => {
        window.location.reload()
    }

    getErrorType = (error) => {
        if (!error) return 'generic'

        const message = error.message.toLowerCase()

        if (message.includes('network') || message.includes('fetch') || error.name === 'TypeError') {
            return 'network'
        }

        if (message.includes('chunk') || message.includes('loading')) {
            return 'chunk'
        }

        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'permission'
        }

        return 'component'
    }

    renderErrorFallback = () => {
        const { error } = this.state
        const { fallback: CustomFallback } = this.props
        const errorType = this.getErrorType(error)

        // Use custom fallback if provided
        if (CustomFallback) {
            return (
                <CustomFallback
                    error={error}
                    errorType={errorType}
                    onRetry={this.handleRetry}
                    onReload={this.handleReload}
                />
            )
        }

        // Default fallback UI based on error type
        switch (errorType) {
            case 'network':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8 text-center">
                            <div>
                                <svg
                                    className="mx-auto h-16 w-16 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                    Connection Problem
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Network error occurred. Please check your internet connection and try again.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                                    data-testid="error-retry"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={this.handleReload}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                )

            case 'chunk':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8 text-center">
                            <div>
                                <svg
                                    className="mx-auto h-16 w-16 text-yellow-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                    Update Required
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    The application has been updated. Please reload the page to get the latest version.
                                </p>
                            </div>
                            <button
                                onClick={this.handleReload}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-h-[44px] touch-manipulation transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                )

            case 'permission':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8 text-center">
                            <div>
                                <svg
                                    className="mx-auto h-16 w-16 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                    Access Denied
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    You don't have permission to access this resource. Please contact support if this is unexpected.
                                </p>
                            </div>
                            <button
                                onClick={this.handleReload}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                )

            default:
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full space-y-8 text-center">
                            <div>
                                <svg
                                    className="mx-auto h-16 w-16 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                    Something went wrong
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Component error occurred. Please refresh the page or try again.
                                </p>
                                {process.env.NODE_ENV === 'development' && error && (
                                    <details className="mt-4 text-left">
                                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                            Error Details (Development)
                                        </summary>
                                        <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                                            {error.message}
                                            {error.stack && `\n\n${error.stack}`}
                                        </pre>
                                    </details>
                                )}
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                                    data-testid="error-retry"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={this.handleReload}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                )
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div data-testid="error-boundary">
                    {this.renderErrorFallback()}
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
'use client';

import React from 'react';

/**
 * Component-Level Error Boundary
 * Provides localized error handling for individual components
 * Allows the rest of the application to continue functioning
 */
class ComponentErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error: error
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log component error
        console.error(`Component Error in ${this.props.componentName || 'Unknown'}:`, error, errorInfo);

        // Log to external service with component context
        if (process.env.NODE_ENV === 'production') {
            this.logComponentError(error, errorInfo);
        }
    }

    logComponentError = (error, errorInfo) => {
        const errorData = {
            component: this.props.componentName || 'Unknown',
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            retryCount: this.state.retryCount,
            props: this.props.errorContext || {}
        };

        // In production, send to error reporting service
        console.log('Component error logged:', errorData);
    };

    handleRetry = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            retryCount: prevState.retryCount + 1
        }));
    };

    render() {
        if (this.state.hasError) {
            const { fallback: CustomFallback, componentName = 'Component' } = this.props;

            // Use custom fallback if provided
            if (CustomFallback) {
                return (
                    <CustomFallback
                        error={this.state.error}
                        onRetry={this.handleRetry}
                        retryCount={this.state.retryCount}
                    />
                );
            }

            // Default component error fallback
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800">
                                {componentName} Error
                            </h3>
                            <p className="mt-1 text-sm text-red-700">
                                This component encountered an error and couldn't load properly.
                            </p>

                            {/* Development error details */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
                                        {this.state.error.message}
                                        {this.state.error.stack && `\n\n${this.state.error.stack}`}
                                    </pre>
                                </details>
                            )}

                            {/* Retry button */}
                            <div className="mt-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                    Try Again
                                    {this.state.retryCount > 0 && (
                                        <span className="ml-1">({this.state.retryCount})</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ComponentErrorBoundary;
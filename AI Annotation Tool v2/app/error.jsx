'use client';

import { useEffect } from 'react';

/**
 * Error Boundary for Page-Level Errors
 * Handles errors that occur during page rendering or data fetching
 */
export default function Error({ error, reset }) {
    useEffect(() => {
        // Log error to console and potentially to external service
        console.error('Page error:', error);

        // In production, you might want to send this to an error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Example: Send to error reporting service
            // errorReportingService.captureException(error);
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                    <svg
                        className="h-8 w-8 text-red-600 dark:text-red-400"
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

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Something went wrong
                </h1>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We encountered an unexpected error while loading this page.
                    This has been logged and we'll look into it.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && error && (
                    <details className="mb-6 text-left">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Error Details (Development)
                        </summary>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                            <div className="font-semibold text-red-600 dark:text-red-400 mb-1">
                                {error.name}: {error.message}
                            </div>
                            {error.stack && (
                                <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                                    {error.stack}
                                </pre>
                            )}
                        </div>
                    </details>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Try again
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Go to homepage
                    </button>
                </div>

                {/* Help Text */}
                <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                    If this problem persists, please refresh the page or contact support.
                </p>
            </div>
        </div>
    );
}
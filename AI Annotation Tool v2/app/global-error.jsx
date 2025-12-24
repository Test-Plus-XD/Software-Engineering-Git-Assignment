'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary
 * Handles critical errors that occur at the root level
 * This is the fallback when other error boundaries fail
 */
export default function GlobalError({ error, reset }) {
    useEffect(() => {
        // Log critical error
        console.error('Global error:', error);

        // In production, send to error reporting service with high priority
        if (process.env.NODE_ENV === 'production') {
            // Example: Send critical error to monitoring service
            // errorReportingService.captureException(error, { level: 'fatal' });
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
                    <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 text-center border border-red-200">
                        {/* Critical Error Icon */}
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                            <svg
                                className="h-10 w-10 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Critical Error
                        </h1>

                        <p className="text-gray-700 mb-6 leading-relaxed">
                            The application encountered a critical error and cannot continue.
                            This issue has been automatically reported to our team.
                        </p>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && error && (
                            <details className="mb-6 text-left bg-gray-50 rounded-md p-4">
                                <summary className="cursor-pointer text-sm font-semibold text-gray-800 mb-3">
                                    Technical Details (Development Mode)
                                </summary>
                                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs font-mono text-gray-800 overflow-auto max-h-40">
                                    <div className="font-bold text-red-700 mb-2">
                                        {error.name}: {error.message}
                                    </div>
                                    {error.stack && (
                                        <pre className="whitespace-pre-wrap text-gray-700 text-xs">
                                            {error.stack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Recovery Actions */}
                        <div className="space-y-4">
                            <button
                                onClick={reset}
                                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Restart Application
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>

                        {/* Additional Help */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-3">
                                If this problem continues to occur:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 text-left">
                                <li>• Clear your browser cache and cookies</li>
                                <li>• Try using a different browser</li>
                                <li>• Check your internet connection</li>
                                <li>• Contact technical support if the issue persists</li>
                            </ul>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                AI Annotation Tool v2 - Error ID: {Date.now()}
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
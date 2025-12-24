'use client';

import { useCallback } from 'react';

/**
 * Custom hook for error logging and reporting
 * Provides consistent error handling across the application
 */
export function useErrorLogging() {
    const logError = useCallback((error, context = {}) => {
        const errorData = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            context: context
        };

        // Always log to console
        console.error('Application Error:', errorData);

        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
            sendToErrorService(errorData);
        }

        return errorData;
    }, []);

    const logWarning = useCallback((message, context = {}) => {
        const warningData = {
            message,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            context: context
        };

        console.warn('Application Warning:', warningData);

        // In production, you might want to send warnings to a different endpoint
        if (process.env.NODE_ENV === 'production') {
            // sendToWarningService(warningData);
        }

        return warningData;
    }, []);

    const logInfo = useCallback((message, context = {}) => {
        const infoData = {
            message,
            timestamp: new Date().toISOString(),
            context: context
        };

        console.info('Application Info:', infoData);
        return infoData;
    }, []);

    return {
        logError,
        logWarning,
        logInfo
    };
}

/**
 * Send error data to external error reporting service
 * This would be replaced with actual service integration (Sentry, LogRocket, etc.)
 */
function sendToErrorService(errorData) {
    // Example implementation - replace with actual service
    try {
        // Mock API call to error reporting service
        if (typeof fetch !== 'undefined') {
            fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData),
            }).catch(err => {
                // Silently fail if error reporting fails
                console.warn('Failed to send error to reporting service:', err);
            });
        }
    } catch (err) {
        // Silently fail if error reporting fails
        console.warn('Error reporting service unavailable:', err);
    }
}

/**
 * Higher-order component for automatic error logging
 */
export function withErrorLogging(WrappedComponent, componentName) {
    return function ErrorLoggedComponent(props) {
        const { logError } = useErrorLogging();

        const handleError = useCallback((error, errorInfo) => {
            logError(error, {
                component: componentName,
                props: props,
                errorInfo: errorInfo
            });
        }, [logError, props]);

        // In a real implementation, you might wrap this with an error boundary
        // For now, we'll just pass the error handler as a prop
        return (
            <WrappedComponent
                {...props}
                onError={handleError}
            />
        );
    };
}

export default useErrorLogging;
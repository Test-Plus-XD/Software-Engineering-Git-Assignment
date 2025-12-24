'use client'

import { useState } from 'react'
import { apiClient } from '../../lib/utils/network-error-handler'

/**
 * DatabaseResetButton Component
 * Provides a button to reset the database with confirmation dialog
 */
export default function DatabaseResetButton() {
    const [isResetting, setIsResetting] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [resetStatus, setResetStatus] = useState(null)

    const handleResetClick = () => {
        setShowConfirmation(true)
        setResetStatus(null)
    }

    const handleConfirmReset = async () => {
        try {
            setIsResetting(true)
            setShowConfirmation(false)
            setResetStatus(null)

            const response = await apiClient.post('/api/database/reset')

            if (response.success) {
                setResetStatus({
                    type: 'success',
                    message: 'Database reset successfully! Sample data has been loaded.'
                })

                // Refresh the page after a short delay to show the new data
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                throw new Error(response.error || 'Reset failed')
            }
        } catch (error) {
            console.error('Database reset error:', error)
            setResetStatus({
                type: 'error',
                message: `Failed to reset database: ${error.message}`
            })
        } finally {
            setIsResetting(false)
        }
    }

    const handleCancelReset = () => {
        setShowConfirmation(false)
    }

    return (
        <div className="relative">
            {/* Reset Button */}
            <button
                onClick={handleResetClick}
                disabled={isResetting}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:bg-red-25 disabled:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px] touch-manipulation transition-colors"
                data-testid="database-reset-button"
            >
                {isResetting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Database
                    </>
                )}
            </button>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <div className="flex items-center mb-4">
                            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Confirm Database Reset
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            This will permanently delete all images, labels, and annotations from the database.
                            Sample data will be loaded after the reset. This action cannot be undone.
                        </p>

                        <div className="flex space-x-3 justify-end">
                            <button
                                onClick={handleCancelReset}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 min-h-[44px] touch-manipulation transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReset}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px] touch-manipulation transition-colors"
                            >
                                Reset Database
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {resetStatus && (
                <div className={`mt-3 p-3 rounded-md ${resetStatus.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <div className="flex items-center">
                        {resetStatus.type === 'success' ? (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="text-sm">{resetStatus.message}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
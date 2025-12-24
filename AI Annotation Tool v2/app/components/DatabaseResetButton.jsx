'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '../../lib/utils/network-error-handler'
import { dataOperations } from '../../lib/utils/data-sync'

/**
 * DatabaseResetButton Component
 * Provides a button to reset the database with confirmation dialog
 */
export default function DatabaseResetButton() {
    const [isResetting, setIsResetting] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [resetStatus, setResetStatus] = useState(null)
    const [isMessageFading, setIsMessageFading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Ensure component is mounted before rendering portals
    useEffect(() => {
        setMounted(true)
    }, [])

    // Auto-fade success messages after 4 seconds
    useEffect(() => {
        if (resetStatus && resetStatus.type === 'success') {
            const fadeTimer = setTimeout(() => {
                setIsMessageFading(true)
                // Remove message completely after fade animation
                setTimeout(() => {
                    setResetStatus(null)
                    setIsMessageFading(false)
                }, 300) // Match the fade transition duration
            }, 4000) // Show for 4 seconds before fading

            return () => clearTimeout(fadeTimer)
        }
    }, [resetStatus])

    const handleResetClick = () => {
        console.log('Reset button clicked!') // Debug log
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

                // Notify components to refresh their data instead of reloading page
                setTimeout(() => {
                    dataOperations.notifyDataRefresh()
                }, 1000)
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

    // Helper function to render modals using portals for proper full-screen positioning
    const renderModal = (content) => {
        if (!mounted) return null
        return createPortal(content, document.body)
    }

    return (
        <>
            {/* Container for button and message */}
            <div className="flex items-center space-x-4">
                {/* Status Message - positioned to the left of button */}
                {resetStatus && (
                    <div
                        className={`flex items-center p-3 rounded-md shadow-lg transition-opacity duration-300 ${isMessageFading ? 'opacity-0' : 'opacity-100'
                            } ${resetStatus.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                        data-testid="reset-status-message"
                    >
                        {resetStatus.type === 'success' ? (
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="text-sm">{resetStatus.message}</span>
                    </div>
                )}

                {/* Reset Button */}
                <button
                    type="button"
                    onClick={handleResetClick}
                    disabled={isResetting}
                    className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:bg-red-200 disabled:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
            </div>

            {/* Confirmation Modal - Portal to body */}
            {showConfirmation && renderModal(
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
                    onClick={(e) => {
                        // Close modal if clicking on backdrop
                        if (e.target === e.currentTarget) {
                            handleCancelReset()
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                                type="button"
                                onClick={handleCancelReset}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmReset}
                                disabled={isResetting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                Reset Database
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
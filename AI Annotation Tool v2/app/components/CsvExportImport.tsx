'use client'

import { useState, useRef } from 'react'
import { dataOperations } from '../../lib/utils/data-sync'

interface ImportResult {
    success: boolean
    imported: number
    skipped: number
    errors: number
    errorDetails: string[]
    message: string
}

/**
 * CsvExportImport component provides CSV export and import functionality
 * Designed as a prominent section above the search and gallery
 */
export default function CsvExportImport() {
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [showImportResult, setShowImportResult] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch('/api/export/csv')

            if (!response.ok) {
                throw new Error('Export failed')
            }

            // Get the CSV content as blob
            const blob = await response.blob()

            // Create download link
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // Get filename from response headers or create default
            const contentDisposition = response.headers.get('content-disposition')
            let filename = 'annotations.csv'
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Export error:', error)
            alert('Failed to export CSV. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    const handleImport = async (file: File) => {
        setIsImporting(true)
        setImportResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/import/csv', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()
            setImportResult(result)
            setShowImportResult(true)

            if (result.success && result.imported > 0) {
                // Refresh the data to show imported items
                dataOperations.notifyDataRefresh()
            }

        } catch (error) {
            console.error('Import error:', error)
            setImportResult({
                success: false,
                imported: 0,
                skipped: 0,
                errors: 1,
                errorDetails: ['Failed to import CSV. Please try again.'],
                message: 'Import failed'
            })
            setShowImportResult(true)
        } finally {
            setIsImporting(false)
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                alert('Please select a CSV file')
                return
            }
            handleImport(file)
        }
    }

    const triggerFileSelect = () => {
        fileInputRef.current?.click()
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        CSV Export & Import
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Download your database or import CSV data
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Export Button */}
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    data-testid="csv-export-button"
                >
                    {isExporting ? (
                        <>
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div className="text-left">
                                <div className="font-semibold">Exporting...</div>
                                <div className="text-sm opacity-90">Please wait</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-left">
                                <div className="font-semibold">Export Database</div>
                                <div className="text-sm opacity-90">Download as CSV file</div>
                            </div>
                        </>
                    )}
                </button>

                {/* Import Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="csv-import-input"
                />

                <button
                    onClick={triggerFileSelect}
                    disabled={isImporting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    data-testid="csv-import-button"
                >
                    {isImporting ? (
                        <>
                            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <div className="text-left">
                                <div className="font-semibold">Importing...</div>
                                <div className="text-sm opacity-90">Processing file</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="text-left">
                                <div className="font-semibold">Import CSV</div>
                                <div className="text-sm opacity-90">Select file to import</div>
                            </div>
                        </>
                    )}
                </button>
            </div>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Import only works with CSV files exported from this application.
                        The export includes all your images and annotations for backup or analysis purposes.
                    </p>
                </div>
            </div>

            {/* Import Result Modal */}
            {showImportResult && importResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImportResult(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${importResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                {importResult.success ? (
                                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Import {importResult.success ? 'Completed' : 'Failed'}
                            </h3>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.imported}</div>
                                    <div className="text-xs text-green-700 dark:text-green-300">Imported</div>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{importResult.skipped}</div>
                                    <div className="text-xs text-yellow-700 dark:text-yellow-300">Skipped</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.errors}</div>
                                    <div className="text-xs text-red-700 dark:text-red-300">Errors</div>
                                </div>
                            </div>

                            {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Error Details:</h4>
                                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                                        {importResult.errorDetails.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowImportResult(false)}
                            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * UploadForm Component
 * Handles file uploads with drag and drop support, validation, and progress tracking
 */
export default function UploadForm({
    onUploadSuccess,
    onUploadError,
    maxFileSize = 10000000, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    className = ''
}) {
    const [selectedFile, setSelectedFile] = useState(null)
    const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
    const [uploadProgress, setUploadProgress] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [validationError, setValidationError] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const [browserSupport, setBrowserSupport] = useState({
        dragDrop: true,
        fileApi: true
    })

    const fileInputRef = useRef(null)

    // Check browser compatibility on mount
    useEffect(() => {
        const checkBrowserSupport = () => {
            const dragDropSupported = 'draggable' in document.createElement('div') &&
                'ondrop' in document.createElement('div') &&
                'FormData' in window &&
                'FileReader' in window

            const fileApiSupported = 'File' in window && 'FileReader' in window && 'FileList' in window

            setBrowserSupport({
                dragDrop: dragDropSupported,
                fileApi: fileApiSupported
            })

            if (!fileApiSupported) {
                setValidationError('Your browser does not support file uploads. Please update to a modern browser.')
            }
        }

        checkBrowserSupport()
    }, [])

    // Validate file type and size
    const validateFile = useCallback((file) => {
        if (!file) return false

        // Edge Case 1: Check for empty files
        if (file.size === 0) {
            setValidationError('The selected file is empty (0 bytes). Please choose a valid image file.')
            return false
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            const supportedFormats = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')
            setValidationError(`Unsupported file format. Please select a ${supportedFormats} image file.`)
            return false
        }

        // Check file size
        if (file.size > maxFileSize) {
            const maxSizeMB = (maxFileSize / 1000000).toFixed(1)
            const fileSizeMB = (file.size / 1000000).toFixed(1)
            setValidationError(`File is too large (${fileSizeMB} MB). Maximum allowed size is ${maxSizeMB} MB. Try compressing your image or choosing a smaller file.`)
            return false
        }

        // Edge Case 2: Check for suspiciously small image files (likely corrupted)
        // Only flag as corrupted if it's smaller than 100 bytes (not 1000)
        if (file.size < 100 && allowedTypes.includes(file.type)) {
            setValidationError('This image file appears to be corrupted or incomplete. Please try a different image.')
            return false
        }

        setValidationError('')
        return true
    }, [allowedTypes, maxFileSize])

    // Handle file selection
    const handleFileSelect = useCallback((files) => {
        if (files.length > 1) {
            setValidationError('Only one file can be uploaded at a time.')
            // Still select the first file
            const file = files[0]
            if (validateFile(file)) {
                setSelectedFile(file)
                setUploadStatus('idle')
                setErrorMessage('')
                setSuccessMessage('')
            } else {
                setSelectedFile(null)
            }
            return
        }

        const file = files[0]
        if (validateFile(file)) {
            setSelectedFile(file)
            setUploadStatus('idle')
            setErrorMessage('')
            setSuccessMessage('')
        } else {
            setSelectedFile(null)
        }
    }, [validateFile])

    // Handle file input change
    const handleFileInputChange = useCallback((event) => {
        const files = Array.from(event.target.files || [])
        handleFileSelect(files)
    }, [handleFileSelect])

    // Handle drag and drop events
    const handleDragEnter = useCallback((event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((event) => {
        event.preventDefault()
        event.stopPropagation()
        // Only set drag over to false if we're leaving the drop zone entirely
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragOver(false)
        }
    }, [])

    const handleDragOver = useCallback((event) => {
        event.preventDefault()
        event.stopPropagation()
    }, [])

    const handleDrop = useCallback((event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragOver(false)

        // Edge Case 3: Handle drag and drop of non-file items
        const files = Array.from(event.dataTransfer.files || [])

        if (files.length === 0) {
            setValidationError('No files were dropped. Please drag and drop image files only.')
            return
        }

        // Edge Case 4: Handle dropping folders or multiple files
        if (files.length > 1) {
            setValidationError(`You dropped ${files.length} items. Please select only one image file at a time.`)
            return
        }

        handleFileSelect(files)
    }, [handleFileSelect])

    // Remove selected file
    const handleRemoveFile = useCallback(() => {
        setSelectedFile(null)
        setValidationError('')
        setErrorMessage('')
        setSuccessMessage('')
        setUploadStatus('idle')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [])

    // Upload file
    const handleUpload = useCallback(async () => {
        if (!selectedFile || validationError) return

        setUploadStatus('uploading')
        setUploadProgress(0)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const formData = new FormData()
            formData.append('image', selectedFile)

            const response = await fetch('/api/images', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }

            const result = await response.json()

            if (result.success) {
                setUploadStatus('success')
                setSuccessMessage('Upload successful!')
                setSelectedFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }

                if (onUploadSuccess) {
                    onUploadSuccess(result.data)
                }
            } else {
                throw new Error(result.error || 'Upload failed')
            }
        } catch (error) {
            setUploadStatus('error')

            // Edge Case 5: Provide specific error messages based on error type
            let userFriendlyMessage = 'Upload failed'

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                userFriendlyMessage = 'Network connection failed. Please check your internet connection and try again.'
            } else if (error.message.includes('413') || error.message.includes('too large')) {
                userFriendlyMessage = 'File is too large for the server. Try compressing your image or choosing a smaller file.'
            } else if (error.message.includes('415') || error.message.includes('unsupported')) {
                userFriendlyMessage = 'File format not supported by the server. Please convert your image to JPEG, PNG, GIF, or WebP format.'
            } else if (error.message.includes('400') || error.message.includes('invalid')) {
                userFriendlyMessage = 'The image file appears to be corrupted or invalid. Please try a different image.'
            } else if (error.message.includes('500') || error.message.includes('server')) {
                userFriendlyMessage = 'Server error occurred. Please try again in a few moments.'
            } else if (error.message.includes('timeout')) {
                userFriendlyMessage = 'Upload timed out. Your file might be too large or your connection is slow. Please try again.'
            } else if (error.message) {
                userFriendlyMessage = error.message
            }

            setErrorMessage(userFriendlyMessage)

            if (onUploadError) {
                onUploadError(userFriendlyMessage)
            }
        }
    }, [selectedFile, validationError, onUploadSuccess, onUploadError])

    // Retry upload
    const handleRetry = useCallback(() => {
        handleUpload()
    }, [handleUpload])

    // Format file size for display
    const formatFileSize = useCallback((bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }, [])

    // Get file type display name
    const getFileTypeDisplay = useCallback((mimeType) => {
        const typeMap = {
            'image/jpeg': 'JPEG',
            'image/png': 'PNG',
            'image/gif': 'GIF',
            'image/webp': 'WebP'
        }
        return typeMap[mimeType] || mimeType
    }, [])

    const isUploading = uploadStatus === 'uploading'
    const hasValidFile = selectedFile && !validationError
    const canUpload = hasValidFile && !isUploading

    return (
        <div className={`upload-form ${className}`}>
            {/* Drag and Drop Zone */}
            <div
                data-testid="drop-zone"
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDragOver && browserSupport.dragDrop ? 'border-blue-500 bg-blue-50 drag-over' : 'border-gray-300'}
                    ${hasValidFile ? 'border-green-500 bg-green-50' : ''}
                    ${validationError ? 'border-red-500 bg-red-50' : ''}
                    ${!browserSupport.fileApi ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDragEnter={browserSupport.dragDrop ? handleDragEnter : undefined}
                onDragLeave={browserSupport.dragDrop ? handleDragLeave : undefined}
                onDragOver={browserSupport.dragDrop ? handleDragOver : undefined}
                onDrop={browserSupport.dragDrop ? handleDrop : undefined}
            >
                {!selectedFile ? (
                    <div>
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                            {browserSupport.dragDrop ? 'Drag and drop your image here' : 'Choose your image file'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            {browserSupport.dragDrop ? 'or click to choose a file' : 'Click the button below to select a file'}
                        </p>
                        <input
                            ref={fileInputRef}
                            data-testid="file-input"
                            type="file"
                            accept={allowedTypes.join(',')}
                            onChange={handleFileInputChange}
                            className="hidden"
                            aria-label="Choose file to upload"
                        />
                        <button
                            type="button"
                            onClick={() => browserSupport.fileApi ? fileInputRef.current?.click() : null}
                            disabled={!browserSupport.fileApi}
                            className={`
                                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                                ${browserSupport.fileApi
                                    ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                                }
                            `}
                        >
                            {browserSupport.fileApi ? 'Choose File' : 'Browser Not Supported'}
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                            Supported formats: JPEG, PNG, GIF, WebP (max {(maxFileSize / 1000000).toFixed(1)} MB)
                            {!browserSupport.dragDrop && (
                                <>
                                    <br />
                                    <span className="text-amber-600">Note: Drag & drop not supported in this browser</span>
                                </>
                            )}
                        </p>
                    </div>
                ) : (
                    <div data-testid="file-preview" className="text-left">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Selected File</h3>
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="text-red-600 hover:text-red-800 focus:outline-none"
                                aria-label="Remove file"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-white p-4 rounded border">
                            <p className="font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                                {getFileTypeDisplay(selectedFile.type)} • {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Validation Error */}
            {validationError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{validationError}</p>
                </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
                <div data-testid="upload-progress" className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Uploading...</span>
                        <span className="text-sm text-gray-500">In progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: '50%' }} // Simplified progress for now
                            role="progressbar"
                            aria-valuenow={50}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                </div>
            )}

            {/* Success Message */}
            {uploadStatus === 'success' && successMessage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {uploadStatus === 'error' && errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">Upload failed: {errorMessage}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
                {uploadStatus !== 'error' ? (
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!canUpload}
                        className={`
                            flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                            ${canUpload
                                ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                            }
                        `}
                    >
                        {isUploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            'Upload'
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Try Again
                    </button>
                )}

                {selectedFile && uploadStatus !== 'uploading' && (
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* File Selection Count */}
            {selectedFile && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                    1 file selected
                </p>
            )}
        </div>
    )
}
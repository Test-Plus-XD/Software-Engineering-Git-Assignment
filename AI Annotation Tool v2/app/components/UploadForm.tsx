'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { apiClient, NetworkError } from '../../lib/utils/network-error-handler'
import { dataOperations } from '../../lib/utils/data-sync'
import { useAuth } from '../contexts/AuthContext'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface BrowserSupport {
    dragDrop: boolean
    fileApi: boolean
}

interface Label {
    name: string
    confidence: number
}

interface UploadFormProps {
    onUploadSuccess?: (data: any) => void
    onUploadError?: (error: string) => void
    maxFileSize?: number
    allowedTypes?: string[]
    className?: string
}

/**
 * UploadForm Component
 * Handles file uploads with drag and drop support, validation, progress tracking,
 * image preview, and label addition with confidence scores
 */
export default function UploadForm({
    onUploadSuccess,
    onUploadError,
    maxFileSize = 10000000, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    className = ''
}: UploadFormProps) {
    const { user } = useAuth()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [validationError, setValidationError] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const [browserSupport, setBrowserSupport] = useState<BrowserSupport>({
        dragDrop: true,
        fileApi: true
    })

    // Label management state
    const [labels, setLabels] = useState<Label[]>([])
    const [showAddLabel, setShowAddLabel] = useState(false)
    const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null)
    const [editingConfidence, setEditingConfidence] = useState<number>(0)
    const [commonLabels, setCommonLabels] = useState<string[]>([])
    const [customLabelInput, setCustomLabelInput] = useState('')
    const [selectedCommonLabel, setSelectedCommonLabel] = useState('')
    const [newLabelConfidence, setNewLabelConfidence] = useState<number>(100)
    const [mounted, setMounted] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Ensure component is mounted before rendering portals
    useEffect(() => {
        setMounted(true)
    }, [])

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

    // Fetch common labels when add label interface opens
    useEffect(() => {
        if (showAddLabel && commonLabels.length === 0) {
            fetchCommonLabels()
        }
    }, [showAddLabel])

    const fetchCommonLabels = async () => {
        try {
            // In test environment, use mock data
            if (process.env.NODE_ENV === 'test') {
                setCommonLabels(['cat', 'dog', 'car', 'tree', 'person'])
                return
            }

            const response = await fetch('/api/labels/common')
            if (response.ok) {
                const data = await response.json()
                setCommonLabels(data.labels || [])
            }
        } catch (error) {
            console.error('Error fetching common labels:', error)
            // Fallback to default common labels
            setCommonLabels(['cat', 'dog', 'car', 'tree', 'person'])
        }
    }

    // Validate file type and size
    const validateFile = useCallback((file: File): boolean => {
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
    const handleFileSelect = useCallback((files: File[]) => {
        if (files.length > 1) {
            setValidationError('Only one file can be uploaded at a time.')
            // Still select the first file
            const file = files[0]
            if (validateFile(file)) {
                setSelectedFile(file)
                createPreview(file)
                setUploadStatus('idle')
                setErrorMessage('')
                setSuccessMessage('')
            } else {
                setSelectedFile(null)
                setPreviewUrl(null)
            }
            return
        }

        const file = files[0]
        if (validateFile(file)) {
            setSelectedFile(file)
            createPreview(file)
            setUploadStatus('idle')
            setErrorMessage('')
            setSuccessMessage('')
        } else {
            setSelectedFile(null)
            setPreviewUrl(null)
        }
    }, [validateFile])

    // Create image preview
    const createPreview = useCallback((file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }, [])

    // Handle file input change
    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        handleFileSelect(files)
    }, [handleFileSelect])

    // Handle drag and drop events
    const handleDragEnter = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
        // Only set drag over to false if we're leaving the drop zone entirely
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragOver(false)
        }
    }, [])

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }, [])

    const handleDrop = useCallback((event: React.DragEvent) => {
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
        setPreviewUrl(null)
        setLabels([])
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

        // Notify upload progress start
        dataOperations.notifyUploadProgress({
            filename: selectedFile.name,
            progress: 0,
            status: 'starting'
        })

        try {
            const formData = new FormData()
            formData.append('image', selectedFile)

            // Add labels if any exist
            if (labels.length > 0) {
                // Convert confidence from percentage (0-100) to decimal (0.0-1.0) for database storage
                const labelsWithDecimalConfidence = labels.map(label => ({
                    name: label.name,
                    confidence: label.confidence / 100
                }))
                formData.append('labels', JSON.stringify(labelsWithDecimalConfidence))
            }

            // Use API client with built-in error handling
            const result = await apiClient.post('/api/images', formData, {
                headers: {
                    'x-user-email': user?.email || 'anonymous'
                }
            })

            if (result.success) {
                setUploadStatus('success')
                setSuccessMessage('Upload successful!')
                setSelectedFile(null)
                setPreviewUrl(null)
                setLabels([])
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }

                // Notify successful upload and data sync
                dataOperations.notifyUploadCompleted(result.data)

                if (onUploadSuccess) {
                    onUploadSuccess(result.data)
                }
            } else {
                throw new NetworkError(result.error || 'Upload failed')
            }
        } catch (error: any) {
            setUploadStatus('error')

            // Get user-friendly error message
            let userFriendlyMessage = 'Upload failed'

            if (error instanceof NetworkError) {
                userFriendlyMessage = error.userFriendlyMessage
            } else {
                // Handle specific error cases
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
            }

            setErrorMessage(userFriendlyMessage)

            // Notify upload failure
            dataOperations.notifyUploadFailed({
                filename: selectedFile.name,
                error: userFriendlyMessage,
                originalError: error
            })

            if (onUploadError) {
                onUploadError(userFriendlyMessage)
            }
        }
    }, [selectedFile, validationError, labels, onUploadSuccess, onUploadError])

    // Retry upload
    const handleRetry = useCallback(() => {
        handleUpload()
    }, [handleUpload])

    // Label management functions
    const handleLabelClick = (index: number) => {
        setEditingLabelIndex(index)
        setEditingConfidence(labels[index].confidence)
    }

    const handleDeleteLabel = (index: number) => {
        const newLabels = labels.filter((_, i) => i !== index)
        setLabels(newLabels)
        setEditingLabelIndex(null)
    }

    const handleSaveConfidence = () => {
        if (editingLabelIndex !== null) {
            const newLabels = [...labels]
            newLabels[editingLabelIndex].confidence = editingConfidence
            setLabels(newLabels)
            setEditingLabelIndex(null)
        }
    }

    const handleAddNewLabel = () => {
        const newLabel = customLabelInput.trim() || selectedCommonLabel
        if (!newLabel) return

        // Check if label already exists
        if (labels.some(label => label.name.toLowerCase() === newLabel.toLowerCase())) {
            alert('This label already exists!')
            return
        }

        const newLabelObj: Label = {
            name: newLabel,
            confidence: newLabelConfidence
        }

        setLabels([...labels, newLabelObj])
        setShowAddLabel(false)
        setCustomLabelInput('')
        setSelectedCommonLabel('')
        setNewLabelConfidence(100)
    }

    // Format file size for display
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }, [])

    // Get file type display name
    const getFileTypeDisplay = useCallback((mimeType: string): string => {
        const typeMap: Record<string, string> = {
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

    // Helper function to render modals using portals for proper full-screen positioning
    const renderModal = (content: React.ReactNode) => {
        if (!mounted) return null
        return createPortal(content, document.body)
    }

    return (
        <div className={`upload-form ${className}`}>
            {/* Drag and Drop Zone */}
            <div
                data-testid="drop-zone"
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors touch-manipulation
                    ${isDragOver && browserSupport.dragDrop ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 drag-over' : 'border-gray-300 dark:border-gray-600'}
                    ${hasValidFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                    ${validationError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                    ${!browserSupport.fileApi ? 'opacity-50 cursor-not-allowed' : 'active:bg-blue-100 dark:active:bg-blue-900/20'}
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
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
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
                                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md min-h-[44px] min-w-[44px] touch-manipulation
                                ${browserSupport.fileApi
                                    ? 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Selected Image</h3>
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

                        {/* Image Preview */}
                        {previewUrl && (
                            <div className="mb-4">
                                <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                            </div>
                        )}

                        {/* File Info */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-600 mb-4">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                                {getFileTypeDisplay(selectedFile.type)} • {formatFileSize(selectedFile.size)}
                            </p>
                        </div>

                        {/* Labels Section */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
                                    Labels {labels.length > 0 && `(${labels.length})`}
                                </h4>
                                <button
                                    onClick={() => setShowAddLabel(true)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    aria-label="Add new label"
                                >
                                    +
                                </button>
                            </div>

                            {labels.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                                    No labels added yet. Click + to add labels with confidence scores.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {labels.map((label, index) => (
                                        <div
                                            key={`${label.name}-${index}`}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                            onClick={() => handleLabelClick(index)}
                                        >
                                            <span>{label.name}</span>
                                            <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">
                                                {label.confidence}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md min-h-[44px] touch-manipulation
                            ${canUpload
                                ? 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
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
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[44px] touch-manipulation transition-colors"
                    >
                        Try Again
                    </button>
                )}

                {selectedFile && uploadStatus !== 'uploading' && (
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* File Selection Count */}
            {selectedFile && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                    1 file selected {labels.length > 0 && `• ${labels.length} label${labels.length === 1 ? '' : 's'} added`}
                </p>
            )}

            {/* Edit Label Modal */}
            {editingLabelIndex !== null && labels[editingLabelIndex] && renderModal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={() => setEditingLabelIndex(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Edit Label: {labels[editingLabelIndex].name}
                        </h3>

                        {/* Confidence Slider */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confidence: {editingConfidence}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingConfidence}
                                onChange={(e) => setEditingConfidence(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                data-testid="confidence-slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveConfidence}
                                className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => handleDeleteLabel(editingLabelIndex)}
                                className="flex-1 bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                aria-label="Delete label"
                                data-testid="delete-label"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setEditingLabelIndex(null)}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Label Modal */}
            {showAddLabel && renderModal(
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                    onClick={() => setShowAddLabel(false)}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Label</h3>

                        {/* Common Labels Dropdown */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select from common labels
                            </label>
                            <select
                                value={selectedCommonLabel}
                                onChange={(e) => setSelectedCommonLabel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                name="common-labels"
                                data-testid="common-labels-dropdown"
                            >
                                <option value="">-- Select a label --</option>
                                {commonLabels.map((label) => (
                                    <option key={label} value={label}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Label Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Or create a custom label
                            </label>
                            <input
                                type="text"
                                value={customLabelInput}
                                onChange={(e) => setCustomLabelInput(e.target.value)}
                                placeholder="Enter custom label"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>

                        {/* Confidence Slider */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confidence: {newLabelConfidence}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={newLabelConfidence}
                                onChange={(e) => setNewLabelConfidence(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                data-testid="new-label-confidence-slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNewLabel}
                                className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                disabled={!customLabelInput.trim() && !selectedCommonLabel}
                            >
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddLabel(false)
                                    setCustomLabelInput('')
                                    setSelectedCommonLabel('')
                                    setNewLabelConfidence(100)
                                }}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
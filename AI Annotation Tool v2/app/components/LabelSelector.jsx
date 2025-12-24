'use client'

/**
 * LabelSelector Component
 * Multi-select label interface with inline creation, search functionality, and keyboard navigation
 */

import { useState, useEffect, useRef } from 'react'
import { apiClient, NetworkError } from '../../lib/utils/network-error-handler'
import { dataOperations, useDataSync, DATA_SYNC_EVENTS } from '../../lib/utils/data-sync'

export default function LabelSelector({
    selectedLabels = [],
    onLabelsChange,
    allowCreate = true,
    placeholder = 'Select labels...'
}) {
    const [availableLabels, setAvailableLabels] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [warningMessage, setWarningMessage] = useState('')

    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)

    // Fetch available labels on component mount
    useEffect(() => {
        fetchLabels()
    }, [])

    // Auto-refresh labels when they change
    useDataSync(DATA_SYNC_EVENTS.LABELS_REFRESHED, () => {
        fetchLabels()
    }, [])

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
                setSearchTerm('')
                setHighlightedIndex(-1)
                setWarningMessage('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isOpen])

    const fetchLabels = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await apiClient.get('/api/labels')

            if (data.success) {
                setAvailableLabels(data.data)
            } else {
                throw new NetworkError(data.error || 'Failed to load labels')
            }
        } catch (err) {
            const errorMessage = err instanceof NetworkError
                ? err.userFriendlyMessage
                : 'Failed to load labels. Please try again.'
            setError(errorMessage)
            console.error('Error fetching labels:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const createNewLabel = async (labelName) => {
        try {
            const data = await apiClient.post('/api/labels', { label_name: labelName })

            if (data.success) {
                // Add new label to available labels
                setAvailableLabels(prev => [...prev, data.data])

                // Add to selected labels
                const newSelectedLabels = [...selectedLabels, labelName]
                onLabelsChange(newSelectedLabels)

                // Notify data sync
                dataOperations.notifyLabelAdded(data.data)

                // Clear search and close dropdown
                setSearchTerm('')
                setIsOpen(false)
                setHighlightedIndex(-1)
            } else {
                throw new NetworkError(data.error || 'Failed to create label')
            }
        } catch (err) {
            const errorMessage = err instanceof NetworkError
                ? err.userFriendlyMessage
                : 'Failed to create label. Please try again.'
            setError(errorMessage)
            console.error('Error creating label:', err)
        }
    }

    const handleLabelSelect = (labelName) => {
        // Clear any previous warning
        setWarningMessage('')

        // Check if label is already selected
        if (selectedLabels.includes(labelName)) {
            setWarningMessage(`Label "${labelName}" is already selected`)
            return
        }

        // Add label to selection
        const newSelectedLabels = [...selectedLabels, labelName]
        onLabelsChange(newSelectedLabels)

        // Clear search but keep dropdown open for multiple selections
        setSearchTerm('')
        setHighlightedIndex(-1)
    }

    const handleLabelRemove = (labelName) => {
        const newSelectedLabels = selectedLabels.filter(label => label !== labelName)
        onLabelsChange(newSelectedLabels)
    }

    const handleKeyDown = (event) => {
        if (!isOpen) return

        const filteredOptions = getFilteredOptions()

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                )
                break

            case 'ArrowUp':
                event.preventDefault()
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                )
                break

            case 'Enter':
                event.preventDefault()
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    const option = filteredOptions[highlightedIndex]
                    if (option.type === 'create') {
                        createNewLabel(option.label)
                    } else {
                        handleLabelSelect(option.label_name)
                    }
                }
                break

            case 'Escape':
                event.preventDefault()
                setIsOpen(false)
                setSearchTerm('')
                setHighlightedIndex(-1)
                setWarningMessage('')
                break
        }
    }

    const getFilteredOptions = () => {
        const filtered = availableLabels.filter(label =>
            label.label_name.toLowerCase().includes(searchTerm.toLowerCase())
        )

        const options = filtered.map(label => ({ ...label, type: 'existing' }))

        // Add create option if search term doesn't match any existing label and allowCreate is true
        if (allowCreate && searchTerm.trim() &&
            !filtered.some(label => label.label_name.toLowerCase() === searchTerm.toLowerCase())) {
            options.push({
                label: searchTerm.trim(),
                type: 'create'
            })
        }

        return options
    }

    const filteredOptions = getFilteredOptions()

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Selected Labels Display */}
            {selectedLabels.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {selectedLabels.map(label => (
                        <div
                            key={label}
                            data-testid={`selected-label-${label}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm min-h-[44px] touch-manipulation"
                        >
                            <span>{label}</span>
                            <button
                                data-testid={`remove-label-${label}`}
                                onClick={() => handleLabelRemove(label)}
                                className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 active:text-blue-900 dark:active:text-blue-200 focus:outline-none min-w-[44px] min-h-[44px] touch-manipulation transition-colors"
                                aria-label={`Remove ${label}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div className="text-sm text-gray-500 dark:text-gray-400 self-center">
                        {selectedLabels.length} selected
                    </div>
                </div>
            )}

            {/* Dropdown Trigger */}
            <div
                data-testid="label-selector-dropdown"
                className="relative border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 cursor-pointer bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 min-h-[44px] touch-manipulation active:ring-2 active:ring-blue-300 dark:active:ring-blue-500 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <input
                    ref={searchInputRef}
                    data-testid="label-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedLabels.length === 0 ? placeholder : 'Search labels...'}
                    className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[44px] text-base md:text-sm touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                        className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Warning Message */}
            {warningMessage && (
                <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {warningMessage}
                </div>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400">Loading labels...</div>
                    ) : error ? (
                        <div className="px-3 py-2 text-red-600 dark:text-red-400">{error}</div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400">No labels found</div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.type === 'create' ? `create-${option.label}` : option.label_id}
                                data-testid={index === highlightedIndex ? 'highlighted-option' : undefined}
                                className={`px-3 py-2 cursor-pointer flex items-center justify-between min-h-[44px] touch-manipulation transition-colors ${index === highlightedIndex
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 text-gray-900 dark:text-white'
                                    } ${selectedLabels.includes(option.label_name || option.label)
                                        ? 'opacity-50'
                                        : ''
                                    }`}
                                onClick={() => {
                                    if (option.type === 'create') {
                                        createNewLabel(option.label)
                                    } else {
                                        handleLabelSelect(option.label_name)
                                    }
                                }}
                            >
                                <span>
                                    {option.type === 'create' ? (
                                        <span className="text-green-600 dark:text-green-400">Create "{option.label}"</span>
                                    ) : (
                                        option.label_name
                                    )}
                                </span>
                                {option.type === 'existing' && (
                                    <span className="text-gray-400 dark:text-gray-500 text-sm">({option.usage_count})</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
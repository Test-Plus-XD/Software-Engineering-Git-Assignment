'use client'

/**
 * LabelSelector Component
 * Multi-select label interface with inline creation, search functionality, and keyboard navigation
 */

import { useState, useEffect, useRef } from 'react'

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
            const response = await fetch('/api/labels')
            const data = await response.json()

            if (data.success) {
                setAvailableLabels(data.data)
            } else {
                setError('Failed to load labels')
            }
        } catch (err) {
            setError('Failed to load labels')
            console.error('Error fetching labels:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const createNewLabel = async (labelName) => {
        try {
            const response = await fetch('/api/labels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label_name: labelName })
            })

            const data = await response.json()

            if (data.success) {
                // Add new label to available labels
                setAvailableLabels(prev => [...prev, data.data])

                // Add to selected labels
                const newSelectedLabels = [...selectedLabels, labelName]
                onLabelsChange(newSelectedLabels)

                // Clear search and close dropdown
                setSearchTerm('')
                setIsOpen(false)
                setHighlightedIndex(-1)
            } else {
                setError('Failed to create label')
            }
        } catch (err) {
            setError('Failed to create label')
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
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm min-h-[44px] touch-manipulation"
                        >
                            <span>{label}</span>
                            <button
                                data-testid={`remove-label-${label}`}
                                onClick={() => handleLabelRemove(label)}
                                className="ml-1 text-blue-600 hover:text-blue-800 active:text-blue-900 focus:outline-none min-w-[44px] min-h-[44px] touch-manipulation transition-colors"
                                aria-label={`Remove ${label}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div className="text-sm text-gray-500 self-center">
                        {selectedLabels.length} selected
                    </div>
                </div>
            )}

            {/* Dropdown Trigger */}
            <div
                data-testid="label-selector-dropdown"
                className="relative border border-gray-300 rounded-md px-3 py-2 cursor-pointer bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 min-h-[44px] touch-manipulation active:ring-2 active:ring-blue-300 transition-colors"
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
                    className="w-full outline-none bg-transparent min-h-[44px] text-base md:text-sm touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                <div className="mt-1 text-sm text-red-600">
                    {warningMessage}
                </div>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="px-3 py-2 text-gray-500">Loading labels...</div>
                    ) : error ? (
                        <div className="px-3 py-2 text-red-600">{error}</div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500">No labels found</div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.type === 'create' ? `create-${option.label}` : option.label_id}
                                data-testid={index === highlightedIndex ? 'highlighted-option' : undefined}
                                className={`px-3 py-2 cursor-pointer flex items-center justify-between min-h-[44px] touch-manipulation transition-colors ${index === highlightedIndex
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'hover:bg-gray-50 active:bg-gray-100'
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
                                        <span className="text-green-600">Create "{option.label}"</span>
                                    ) : (
                                        option.label_name
                                    )}
                                </span>
                                {option.type === 'existing' && (
                                    <span className="text-gray-400 text-sm">({option.usage_count})</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
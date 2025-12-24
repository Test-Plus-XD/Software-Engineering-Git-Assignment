'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * SearchBar Component
 * Provides search and filter functionality for the image gallery
 */
export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedLabel, setSelectedLabel] = useState(searchParams.get('label') || '');
    const [availableLabels, setAvailableLabels] = useState([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(true);
    const [labelsError, setLabelsError] = useState(null);

    // Load available labels for filter dropdown
    useEffect(() => {
        const loadLabels = async () => {
            try {
                setIsLoadingLabels(true);
                setLabelsError(null);

                const response = await fetch('/api/labels');

                if (!response.ok) {
                    throw new Error(`Failed to load labels: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setAvailableLabels(data.data || []);
                } else {
                    throw new Error(data.error || 'Failed to load labels');
                }
            } catch (error) {
                console.error('Error loading labels:', error);
                setLabelsError(error.message);
                setAvailableLabels([]);
            } finally {
                setIsLoadingLabels(false);
            }
        };

        loadLabels();
    }, []);

    // Update URL with search parameters
    const updateURL = useCallback((newSearch, newLabel) => {
        const params = new URLSearchParams();

        if (newSearch && newSearch.trim()) {
            params.set('search', newSearch.trim());
        }

        if (newLabel && newLabel.trim()) {
            params.set('label', newLabel.trim());
        }

        const queryString = params.toString();
        const newURL = queryString ? `${pathname}?${queryString}` : pathname;

        router.replace(newURL);
    }, [router, pathname]);

    // Handle search input changes
    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    // Handle search submission
    const handleSearchSubmit = useCallback((event) => {
        event.preventDefault();
        updateURL(searchTerm, selectedLabel);
    }, [searchTerm, selectedLabel, updateURL]);

    // Handle Enter key press in search input
    const handleSearchKeyDown = useCallback((event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            updateURL(searchTerm, selectedLabel);
        }
    }, [searchTerm, selectedLabel, updateURL]);

    // Handle label filter change
    const handleLabelChange = useCallback((event) => {
        const newLabel = event.target.value;
        setSelectedLabel(newLabel);
        updateURL(searchTerm, newLabel);
    }, [searchTerm, updateURL]);

    // Clear search
    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        updateURL('', selectedLabel);
    }, [selectedLabel, updateURL]);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedLabel('');
        updateURL('', '');
    }, [updateURL]);

    // Count active filters
    const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedLabel ? 1 : 0);

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Search Input */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search images by name..."
                            aria-label="Search images by name"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        aria-label="Search"
                        className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
                    >
                        Search
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Label Filter */}
                    <div className="flex items-center gap-2">
                        <label htmlFor="label-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Filter by label:
                        </label>
                        <select
                            id="label-filter"
                            value={selectedLabel}
                            onChange={handleLabelChange}
                            aria-label="Filter images by label"
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            disabled={isLoadingLabels}
                        >
                            <option value="" className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">All labels</option>
                            {availableLabels.map((label) => (
                                <option key={label.label_id} value={label.label_name} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                                    {label.label_name}
                                </option>
                            ))}
                        </select>

                        {isLoadingLabels && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                        )}

                        {labelsError && (
                            <span className="text-xs text-red-600 dark:text-red-400" title={labelsError}>
                                Failed to load labels
                            </span>
                        )}
                    </div>

                    {/* Active Filters Indicator */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                            </span>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                aria-label="Clear filters"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(searchTerm || selectedLabel) && (
                    <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                                Search: "{searchTerm}"
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                                    aria-label="Remove search filter"
                                >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}

                        {selectedLabel && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                                Label: {selectedLabel}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLabel('');
                                        updateURL(searchTerm, '');
                                    }}
                                    className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 focus:outline-none"
                                    aria-label="Remove label filter"
                                >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
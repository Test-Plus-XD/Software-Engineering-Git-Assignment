/**
 * Data Synchronization Utility
 * Provides mechanisms for keeping UI synchronized with data updates
 * Includes event-based updates and optimistic UI patterns
 */

/**
 * Simple event emitter for data synchronization
 */
class DataSyncEmitter {
    constructor() {
        this.listeners = new Map()
    }

    /**
     * Subscribe to data update events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }

        this.listeners.get(event).add(callback)

        // Return unsubscribe function
        return () => {
            const eventListeners = this.listeners.get(event)
            if (eventListeners) {
                eventListeners.delete(callback)
                if (eventListeners.size === 0) {
                    this.listeners.delete(event)
                }
            }
        }
    }

    /**
     * Emit data update event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const eventListeners = this.listeners.get(event)
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in data sync listener for event "${event}":`, error)
                }
            })
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    off(event) {
        this.listeners.delete(event)
    }

    /**
     * Remove all listeners
     */
    clear() {
        this.listeners.clear()
    }
}

// Global data sync emitter instance
export const dataSyncEmitter = new DataSyncEmitter()

/**
 * Data sync events
 */
export const DATA_SYNC_EVENTS = {
    IMAGE_ADDED: 'image:added',
    IMAGE_UPDATED: 'image:updated',
    IMAGE_DELETED: 'image:deleted',
    IMAGES_REFRESHED: 'images:refreshed',
    LABEL_ADDED: 'label:added',
    LABEL_UPDATED: 'label:updated',
    LABEL_DELETED: 'label:deleted',
    LABELS_REFRESHED: 'labels:refreshed',
    UPLOAD_PROGRESS: 'upload:progress',
    UPLOAD_COMPLETED: 'upload:completed',
    UPLOAD_FAILED: 'upload:failed'
}

/**
 * React hook for subscribing to data sync events
 * @param {string} event - Event name to listen to
 * @param {Function} callback - Callback function
 * @param {Array} deps - Dependencies array
 */
export function useDataSync(event, callback, deps = []) {
    React.useEffect(() => {
        const unsubscribe = dataSyncEmitter.on(event, callback)
        return unsubscribe
    }, deps)
}

/**
 * React hook for managing optimistic updates
 * @param {*} initialData - Initial data state
 * @returns {Object} - Optimistic update utilities
 */
export function useOptimisticUpdates(initialData = null) {
    const [data, setData] = React.useState(initialData)
    const [optimisticUpdates, setOptimisticUpdates] = React.useState(new Map())

    /**
     * Apply optimistic update
     * @param {string} id - Unique ID for this update
     * @param {Function} updateFn - Function to apply optimistic update
     * @param {Function} asyncOperation - Async operation to perform
     * @returns {Promise} - Promise that resolves when operation completes
     */
    const applyOptimisticUpdate = React.useCallback(async (id, updateFn, asyncOperation) => {
        // Store original data for rollback
        const originalData = data

        // Apply optimistic update
        const optimisticData = updateFn(data)
        setData(optimisticData)

        // Track this optimistic update
        setOptimisticUpdates(prev => new Map(prev).set(id, {
            originalData,
            optimisticData,
            timestamp: Date.now()
        }))

        try {
            // Perform actual operation
            const result = await asyncOperation()

            // Remove optimistic update tracking
            setOptimisticUpdates(prev => {
                const newMap = new Map(prev)
                newMap.delete(id)
                return newMap
            })

            // Update with real data
            if (result && typeof result === 'object') {
                setData(result)
            }

            return result
        } catch (error) {
            // Rollback optimistic update
            setData(originalData)
            setOptimisticUpdates(prev => {
                const newMap = new Map(prev)
                newMap.delete(id)
                return newMap
            })

            throw error
        }
    }, [data])

    /**
     * Rollback specific optimistic update
     * @param {string} id - Update ID to rollback
     */
    const rollbackUpdate = React.useCallback((id) => {
        const update = optimisticUpdates.get(id)
        if (update) {
            setData(update.originalData)
            setOptimisticUpdates(prev => {
                const newMap = new Map(prev)
                newMap.delete(id)
                return newMap
            })
        }
    }, [optimisticUpdates])

    /**
     * Clear all optimistic updates and rollback to original data
     */
    const clearOptimisticUpdates = React.useCallback(() => {
        // Find the earliest original data
        let earliestOriginalData = data
        let earliestTimestamp = Date.now()

        optimisticUpdates.forEach(update => {
            if (update.timestamp < earliestTimestamp) {
                earliestTimestamp = update.timestamp
                earliestOriginalData = update.originalData
            }
        })

        setData(earliestOriginalData)
        setOptimisticUpdates(new Map())
    }, [data, optimisticUpdates])

    return {
        data,
        setData,
        optimisticUpdates: Array.from(optimisticUpdates.entries()),
        applyOptimisticUpdate,
        rollbackUpdate,
        clearOptimisticUpdates,
        hasOptimisticUpdates: optimisticUpdates.size > 0
    }
}

/**
 * React hook for automatic data refresh
 * @param {Function} refreshFn - Function to call for refresh
 * @param {Array} events - Events that should trigger refresh
 * @param {Object} options - Refresh options
 */
export function useAutoRefresh(refreshFn, events = [], options = {}) {
    const {
        debounceMs = 500,
        maxRefreshRate = 5000, // Maximum one refresh per 5 seconds
        enabled = true
    } = options

    const lastRefreshRef = React.useRef(0)
    const timeoutRef = React.useRef(null)

    const debouncedRefresh = React.useCallback(() => {
        if (!enabled) return

        const now = Date.now()
        const timeSinceLastRefresh = now - lastRefreshRef.current

        if (timeSinceLastRefresh < maxRefreshRate) {
            // Too soon, schedule for later
            const delay = maxRefreshRate - timeSinceLastRefresh
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(debouncedRefresh, delay)
            return
        }

        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        // Perform refresh
        lastRefreshRef.current = now
        refreshFn()
    }, [refreshFn, enabled, maxRefreshRate])

    React.useEffect(() => {
        if (!enabled || events.length === 0) return

        const unsubscribers = events.map(event =>
            dataSyncEmitter.on(event, () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
                timeoutRef.current = setTimeout(debouncedRefresh, debounceMs)
            })
        )

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe())
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [events, debouncedRefresh, debounceMs, enabled])

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])
}

/**
 * Utility functions for common data operations
 */
export const dataOperations = {
    /**
     * Notify that an image was added
     * @param {Object} image - Added image data
     */
    notifyImageAdded(image) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGE_ADDED, image)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGES_REFRESHED, { reason: 'image_added', image })
    },

    /**
     * Notify that an image was updated
     * @param {Object} image - Updated image data
     */
    notifyImageUpdated(image) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGE_UPDATED, image)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGES_REFRESHED, { reason: 'image_updated', image })
    },

    /**
     * Notify that an image was deleted
     * @param {number} imageId - Deleted image ID
     */
    notifyImageDeleted(imageId) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGE_DELETED, { imageId })
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGES_REFRESHED, { reason: 'image_deleted', imageId })
    },

    /**
     * Notify that a label was added
     * @param {Object} label - Added label data
     */
    notifyLabelAdded(label) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABEL_ADDED, label)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABELS_REFRESHED, { reason: 'label_added', label })
    },

    /**
     * Notify that a label was updated
     * @param {Object} label - Updated label data
     */
    notifyLabelUpdated(label) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABEL_UPDATED, label)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABELS_REFRESHED, { reason: 'label_updated', label })
    },

    /**
     * Notify that a label was deleted
     * @param {number} labelId - Deleted label ID
     */
    notifyLabelDeleted(labelId) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABEL_DELETED, { labelId })
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABELS_REFRESHED, { reason: 'label_deleted', labelId })
    },

    /**
     * Notify upload progress
     * @param {Object} progress - Upload progress data
     */
    notifyUploadProgress(progress) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.UPLOAD_PROGRESS, progress)
    },

    /**
     * Notify upload completion
     * @param {Object} result - Upload result data
     */
    notifyUploadCompleted(result) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.UPLOAD_COMPLETED, result)
        // Also trigger image refresh since a new image was added
        this.notifyImageAdded(result)
    },

    /**
     * Notify upload failure
     * @param {Object} error - Upload error data
     */
    notifyUploadFailed(error) {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.UPLOAD_FAILED, error)
    }
}

// Export for React usage
if (typeof React !== 'undefined') {
    const React = require('react')
    module.exports.useDataSync = useDataSync
    module.exports.useOptimisticUpdates = useOptimisticUpdates
    module.exports.useAutoRefresh = useAutoRefresh
}
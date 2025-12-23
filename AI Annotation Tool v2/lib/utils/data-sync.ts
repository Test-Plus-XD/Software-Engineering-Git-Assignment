/**
 * Data Synchronization Utility
 * Provides mechanisms for keeping UI synchronized with data updates
 * Includes event-based updates and optimistic UI patterns
 */

import React from 'react'

type EventCallback = (data: any) => void
type UnsubscribeFunction = () => void

/**
 * Simple event emitter for data synchronization
 */
class DataSyncEmitter {
    private listeners = new Map<string, Set<EventCallback>>()

    /**
     * Subscribe to data update events
     */
    on(event: string, callback: EventCallback): UnsubscribeFunction {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }

        this.listeners.get(event)!.add(callback)

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
     */
    emit(event: string, data: any): void {
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
     */
    off(event: string): void {
        this.listeners.delete(event)
    }

    /**
     * Remove all listeners
     */
    clear(): void {
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
} as const

type DataSyncEvent = typeof DATA_SYNC_EVENTS[keyof typeof DATA_SYNC_EVENTS]

/**
 * React hook for subscribing to data sync events
 */
export function useDataSync(event: DataSyncEvent, callback: EventCallback, deps: React.DependencyList = []): void {
    React.useEffect(() => {
        const unsubscribe = dataSyncEmitter.on(event, callback)
        return unsubscribe
    }, deps)
}

interface OptimisticUpdate<T = any> {
    originalData: T
    optimisticData: T
    timestamp: number
}

interface OptimisticUpdateResult<T = any> {
    data: T
    setData: React.Dispatch<React.SetStateAction<T>>
    optimisticUpdates: [string, OptimisticUpdate<T>][]
    applyOptimisticUpdate: (id: string, updateFn: (data: T) => T, asyncOperation: () => Promise<T>) => Promise<T>
    rollbackUpdate: (id: string) => void
    clearOptimisticUpdates: () => void
    hasOptimisticUpdates: boolean
}

/**
 * React hook for managing optimistic updates
 */
export function useOptimisticUpdates<T = any>(initialData: T | null = null): OptimisticUpdateResult<T> {
    const [data, setData] = React.useState<T>(initialData as T)
    const [optimisticUpdates, setOptimisticUpdates] = React.useState(new Map<string, OptimisticUpdate<T>>())

    /**
     * Apply optimistic update
     */
    const applyOptimisticUpdate = React.useCallback(async (
        id: string,
        updateFn: (data: T) => T,
        asyncOperation: () => Promise<T>
    ): Promise<T> => {
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
     */
    const rollbackUpdate = React.useCallback((id: string): void => {
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
    const clearOptimisticUpdates = React.useCallback((): void => {
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

interface AutoRefreshOptions {
    debounceMs?: number
    maxRefreshRate?: number
    enabled?: boolean
}

/**
 * React hook for automatic data refresh
 */
export function useAutoRefresh(
    refreshFn: () => void,
    events: DataSyncEvent[] = [],
    options: AutoRefreshOptions = {}
): void {
    const {
        debounceMs = 500,
        maxRefreshRate = 5000, // Maximum one refresh per 5 seconds
        enabled = true
    } = options

    const lastRefreshRef = React.useRef(0)
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

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
     */
    notifyImageAdded(image: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGE_ADDED, image)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGES_REFRESHED, { reason: 'image_added', image })
    },

    /**
     * Notify that an image was updated
     */
    notifyImageUpdated(image: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGE_UPDATED, image)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGES_REFRESHED, { reason: 'image_updated', image })
    },

    /**
     * Notify that an image was deleted
     */
    notifyImageDeleted(imageId: number): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGE_DELETED, { imageId })
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.IMAGES_REFRESHED, { reason: 'image_deleted', imageId })
    },

    /**
     * Notify that a label was added
     */
    notifyLabelAdded(label: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABEL_ADDED, label)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABELS_REFRESHED, { reason: 'label_added', label })
    },

    /**
     * Notify that a label was updated
     */
    notifyLabelUpdated(label: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABEL_UPDATED, label)
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABELS_REFRESHED, { reason: 'label_updated', label })
    },

    /**
     * Notify that a label was deleted
     */
    notifyLabelDeleted(labelId: number): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABEL_DELETED, { labelId })
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.LABELS_REFRESHED, { reason: 'label_deleted', labelId })
    },

    /**
     * Notify upload progress
     */
    notifyUploadProgress(progress: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.UPLOAD_PROGRESS, progress)
    },

    /**
     * Notify upload completion
     */
    notifyUploadCompleted(result: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.UPLOAD_COMPLETED, result)
        // Also trigger image refresh since a new image was added
        this.notifyImageAdded(result)
    },

    /**
     * Notify upload failure
     */
    notifyUploadFailed(error: any): void {
        dataSyncEmitter.emit(DATA_SYNC_EVENTS.UPLOAD_FAILED, error)
    }
}
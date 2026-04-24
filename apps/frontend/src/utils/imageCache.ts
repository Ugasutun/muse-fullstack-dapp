// Advanced image caching and preloading utilities

import { useState, useCallback, useEffect } from 'react'

export interface ImageCacheEntry {
  url: string
  blob: Blob
  timestamp: number
  size: number
  accessCount: number
  lastAccessed: number
}

export interface PreloadOptions {
  priority?: boolean
  timeout?: number
  retryCount?: number
  onProgress?: (loaded: number, total: number) => void
  onComplete?: (url: string) => void
  onError?: (url: string, error: Error) => void
}

class AdvancedImageCache {
  private cache = new Map<string, ImageCacheEntry>()
  private loadingPromises = new Map<string, Promise<Blob>>()
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly MAX_CACHE_ENTRIES = 100
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
  private currentCacheSize = 0

  private generateKey(url: string, width?: number, height?: number): string {
    return `${url}-${width || 'auto'}-${height || 'auto'}`
  }

  private isExpired(entry: ImageCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_DURATION
  }

  private cleanExpiredEntries(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.removeEntry(key)
      }
    }
  }

  private enforceCacheLimit(): void {
    // Remove expired entries first
    this.cleanExpiredEntries()

    if (this.cache.size > this.MAX_CACHE_ENTRIES || this.currentCacheSize > this.MAX_CACHE_SIZE) {
      // Sort by least recently used
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => {
          // Prioritize removing expired entries
          const aExpired = this.isExpired(a)
          const bExpired = this.isExpired(b)
          if (aExpired && !bExpired) return -1
          if (!aExpired && bExpired) return 1
          
          // Then by last accessed time
          return a.lastAccessed - b.lastAccessed
        })

      const toRemove = entries.slice(0, Math.ceil(entries.length * 0.3)) // Remove 30%
      toRemove.forEach(([key]) => this.removeEntry(key))
    }
  }

  private removeEntry(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      this.currentCacheSize -= entry.size
      this.cache.delete(key)
    }
  }

  private updateAccessTime(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      entry.accessCount++
    }
  }

  async preloadImage(url: string, options: PreloadOptions = {}): Promise<Blob> {
    const key = this.generateKey(url)
    
    // Check cache first
    const cached = this.get(url)
    if (cached) {
      options.onComplete?.(url)
      return cached
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(key)
    if (existingPromise) {
      return existingPromise
    }

    // Create new loading promise
    const promise = this.fetchImage(url, options)
    this.loadingPromises.set(key, promise)

    try {
      const blob = await promise
      this.store(url, blob)
      options.onComplete?.(url)
      return blob
    } catch (error) {
      options.onError?.(url, error as Error)
      throw error
    } finally {
      this.loadingPromises.delete(key)
    }
  }

  async preloadBatch(urls: string[], options: PreloadOptions = {}): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>()
    const promises = urls.map(async (url) => {
      try {
        const blob = await this.preloadImage(url, options)
        results.set(url, blob)
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error)
      }
    })

    await Promise.allSettled(promises)
    return results
  }

  private async fetchImage(url: string, options: PreloadOptions): Promise<Blob> {
    const timeout = options.timeout || 10000
    const retryCount = options.retryCount || 2

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          signal: controller.signal,
          priority: options.priority ? 'high' : 'auto'
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentLength = response.headers.get('content-length')
        const total = contentLength ? parseInt(contentLength, 10) : 0

        if (response.body) {
          const reader = response.body.getReader()
          const chunks: BlobPart[] = []
          let loaded = 0

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            if (value) {
              chunks.push(value)
              loaded += value.length
              options.onProgress?.(loaded, total)
            }
          }

          const blob = new Blob(chunks)
          return blob
        } else {
          return await response.blob()
        }
      } catch (error) {
        if (attempt === retryCount) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    throw new Error('Failed to fetch image after retries')
  }

  get(url: string, width?: number, height?: number): Blob | null {
    const key = this.generateKey(url, width, height)
    const entry = this.cache.get(key)
    
    if (entry && !this.isExpired(entry)) {
      this.updateAccessTime(key)
      return entry.blob
    }
    
    return null
  }

  store(url: string, blob: Blob, width?: number, height?: number): void {
    const key = this.generateKey(url, width, height)
    const size = blob.size
    const timestamp = Date.now()

    // Remove existing entry if present
    this.removeEntry(key)

    // Check cache limits
    this.enforceCacheLimit()

    // Add new entry
    this.cache.set(key, {
      url,
      blob,
      timestamp,
      size,
      accessCount: 1,
      lastAccessed: timestamp
    })

    this.currentCacheSize += size
  }

  clear(): void {
    this.cache.clear()
    this.currentCacheSize = 0
  }

  getStats(): {
    entries: number
    size: number
    maxSize: number
    hitRate: number
  } {
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0)
    
    return {
      entries: this.cache.size,
      size: this.currentCacheSize,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: totalAccess > 0 ? (totalAccess - this.cache.size) / totalAccess : 0
    }
  }

  // Smart preloading based on viewport and user behavior
  smartPreload(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    // Sort by priority (high priority images first)
    const sortedUrls = urls.sort(() => Math.random() - 0.5) // Simple shuffle for demo
    
    // In a real implementation, you would:
    // 1. Prioritize images above the fold
    // 2. Consider user scroll direction
    // 3. Analyze user interaction patterns
    // 4. Preload based on network conditions
    
    const batchSize = priority === 'high' ? 5 : priority === 'medium' ? 3 : 1
    const batches = this.chunkArray(sortedUrls, batchSize)
    
    batches.forEach((batch, index) => {
      setTimeout(() => {
        this.preloadBatch(batch, {
          priority: priority === 'high',
          timeout: priority === 'high' ? 5000 : 10000
        })
      }, index * 1000)
    })
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Global cache instance
export const imageCache = new AdvancedImageCache()

// Utility functions
export const preloadCriticalImages = (urls: string[]): void => {
  imageCache.smartPreload(urls, 'high')
}

export const preloadSecondaryImages = (urls: string[]): void => {
  imageCache.smartPreload(urls, 'medium')
}

export const preloadBackgroundImages = (urls: string[]): void => {
  imageCache.smartPreload(urls, 'low')
}

// Hook for React components
export const useImagePreload = (urls: string[], options?: PreloadOptions) => {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Set<string>>(new Set())

  const preload = useCallback(async () => {
    setIsLoading(true)
    setProgress(0)
    setLoaded(new Set())
    setErrors(new Set())

    try {
      await imageCache.preloadBatch(urls, {
        ...options,
        onProgress: (loadedCount, total) => {
          setProgress(total > 0 ? (loadedCount / total) * 100 : 0)
          options?.onProgress?.(loadedCount, total)
        },
        onComplete: (url) => {
          setLoaded(prev => new Set([...prev, url]))
          options?.onComplete?.(url)
        },
        onError: (url) => {
          setErrors(prev => new Set([...prev, url]))
          options?.onError?.(url, new Error('Preload failed'))
        }
      })
    } finally {
      setIsLoading(false)
    }
  }, [urls, options])

  useEffect(() => {
    if (urls.length > 0) {
      preload()
    }
  }, [urls, preload])

  return {
    isLoading,
    progress,
    loaded,
    errors,
    preload,
    stats: imageCache.getStats()
  }
}

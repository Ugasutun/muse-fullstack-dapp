import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { Image as ImageIcon, Download } from 'lucide-react'

export interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty' | 'color' | 'skeleton'
  blurDataURL?: string
  sizes?: string
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onLoadStart?: () => void
  onLoadProgress?: (progress: number) => void
  cacheKey?: string
  preload?: boolean
  fadeInDuration?: number
  enableCache?: boolean
}

// Image cache management
class ImageCacheManager {
  private cache = new Map<string, { url: string; timestamp: number }>()
  private loadingPromises = new Map<string, Promise<string>>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MAX_CACHE_SIZE = 100

  private generateCacheKey(src: string, width?: number, height?: number, quality?: number, format?: string): string {
    return `${src}-${width || 'auto'}-${height || 'auto'}-${quality || 75}-${format || 'webp'}`
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION
  }

  private cleanExpiredEntries(): void {
    for (const [key, value] of this.cache.entries()) {
      if (this.isExpired(value.timestamp)) {
        this.cache.delete(key)
      }
    }
  }

  private enforceCacheLimit(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE + 10)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  get(src: string, width?: number, height?: number, quality?: number, format?: string): string | null {
    this.cleanExpiredEntries()
    const key = this.generateCacheKey(src, width, height, quality, format)
    const cached = this.cache.get(key)
    
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.url
    }
    
    return null
  }

  set(src: string, optimizedUrl: string, width?: number, height?: number, quality?: number, format?: string): void {
    const key = this.generateCacheKey(src, width, height, quality, format)
    this.cache.set(key, { url: optimizedUrl, timestamp: Date.now() })
    this.enforceCacheLimit()
  }

  async loadAndOptimize(src: string, width?: number, height?: number, quality?: number, format?: string): Promise<string> {
    const key = this.generateCacheKey(src, width, height, quality, format)
    
    // Check cache first
    const cached = this.get(src, width, height, quality, format)
    if (cached) return cached
    
    // Check if already loading
    const existingPromise = this.loadingPromises.get(key)
    if (existingPromise) return existingPromise
    
    // Create new loading promise
    const promise = this.performOptimization(src, width, height, quality, format)
    this.loadingPromises.set(key, promise)
    
    try {
      const optimizedUrl = await promise
      this.set(src, optimizedUrl, width, height, quality, format)
      return optimizedUrl
    } finally {
      this.loadingPromises.delete(key)
    }
  }

  private async performOptimization(src: string, width?: number, height?: number, quality?: number, format?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          // Calculate dimensions
          const targetWidth = width || img.width
          const targetHeight = height || img.height
          const aspectRatio = img.width / img.height
          
          let finalWidth = targetWidth
          let finalHeight = targetHeight
          
          if (!width && height) {
            finalWidth = height * aspectRatio
            finalHeight = height
          } else if (width && !height) {
            finalWidth = width
            finalHeight = width / aspectRatio
          }
          
          canvas.width = finalWidth
          canvas.height = finalHeight
          
          // Draw and optimize image
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight)
          
          // Convert to blob and create URL
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                resolve(url)
              } else {
                reject(new Error('Could not create blob'))
              }
            },
            `image/${format === 'auto' ? 'webp' : format}`,
            quality / 100
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Image failed to load'))
      img.src = src
    })
  }
}

// Global cache manager instance
const imageCacheManager = new ImageCacheManager()

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  format = 'auto',
  onError,
  onLoad,
  onLoadStart,
  onLoadProgress,
  cacheKey,
  preload = false,
  fadeInDuration = 300,
  enableCache = true,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px',
    skip: priority
  })

  const refs = (node: HTMLImageElement | null) => {
    imgRef.current = node
    inViewRef(node)
  }

  const generateOptimizedSrc = useCallback(async (originalSrc: string) => {
    if (!originalSrc) return ''
    
    if (enableCache) {
      try {
        return await imageCacheManager.loadAndOptimize(originalSrc, width, height, quality, format)
      } catch (error) {
        console.warn('Image optimization failed, using original:', error)
        return originalSrc
      }
    }
    
    // Fallback to original image
    return originalSrc
  }, [width, height, quality, format, enableCache])

  const generatePlaceholderSrc = useCallback(() => {
    if (blurDataURL) return blurDataURL
    
    if (placeholder === 'skeleton') {
      return ''
    }
    
    // Generate a simple gradient placeholder
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    canvas.width = width || 400
    canvas.height = height || 300
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    return canvas.toDataURL()
  }, [width, height, blurDataURL, placeholder])

  useEffect(() => {
    if ((priority || preload || inView) && src && !isLoading && !isLoaded) {
      setIsLoading(true)
      setLoadProgress(0)
      onLoadStart?.()
      
      generateOptimizedSrc(src).then((optimizedSrc) => {
        setImageSrc(optimizedSrc)
      }).catch((error) => {
        console.error('Failed to generate optimized src:', error)
        setImageSrc(src)
      }).finally(() => {
        setIsLoading(false)
      })
    }
  }, [priority, preload, inView, src, width, height, quality, format, generateOptimizedSrc, isLoading, isLoaded, onLoadStart])

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    setLoadProgress(100)
    onLoad?.(e)
  }, [onLoad])

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    setIsLoading(false)
    setLoadProgress(0)
    onError?.(e)
  }, [onError])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoaded(false)
    setIsLoading(true)
    setLoadProgress(0)
    
    generateOptimizedSrc(src).then((optimizedSrc) => {
      setImageSrc(optimizedSrc)
    }).catch(() => {
      setImageSrc(src)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [generateOptimizedSrc, src])

  // Simulate loading progress
  useEffect(() => {
    if (isLoading && loadProgress < 90) {
      const timer = setTimeout(() => {
        setLoadProgress(prev => Math.min(prev + 10, 90))
        onLoadProgress?.(loadProgress + 10)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, loadProgress, onLoadProgress])

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg cursor-pointer transition-all hover:from-gray-200 hover:to-gray-300 ${className}`}
        style={{ width, height }}
        onClick={handleRetry}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleRetry()}
        aria-label="Retry loading image"
      >
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Failed to load</p>
          <p className="text-xs text-gray-400 mt-1">Click to retry</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {placeholder !== 'empty' && !isLoaded && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: placeholder === 'blur' && blurDataURL 
              ? `url(${blurDataURL})` 
              : placeholder === 'blur' 
                ? `url(${generatePlaceholderSrc()})` 
                : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: placeholder === 'blur' ? 'blur(20px)' : 'none',
            transform: placeholder === 'blur' ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          {placeholder === 'skeleton' && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
      )}
      
      {/* Loading progress indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mb-2" />
          {loadProgress > 0 && (
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          ref={refs}
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-${fadeInDuration} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Download indicator for cached images */}
      {enableCache && isLoaded && (
        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-black/50 text-white p-1 rounded-full">
            <Download className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  )
}

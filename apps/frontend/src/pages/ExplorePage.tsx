import { useState, useCallback, useEffect } from 'react'
import { ArtworkGrid } from '@/components/ArtworkGrid'
import { FilterPanel } from '@/components/FilterPanel'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { useErrorContext } from '@/contexts/ErrorContext'
import { artworkService } from '@/services/artworkService'
import { type Artwork, type ArtworksFilters } from '@/types'
import { type AppError, ErrorHandler } from '@/utils/errorHandler'
import { useInfiniteQuery } from '@tanstack/react-query'

export function ExplorePage() {
  const { showError } = useErrorContext()
  const [filters, setFilters] = useState<ArtworksFilters>({})
  const [fetchError, setFetchError] = useState<AppError | null>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: ['artworks', filters],
    queryFn: async ({ pageParam = 1 }) => {
      return artworkService.getArtworks(pageParam as number, 12, filters)
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  })

  // Surface TanStack Query errors into local error state for the ErrorDisplay
  useEffect(() => {
    if (queryError) {
      setFetchError(ErrorHandler.handle(queryError))
    } else {
      setFetchError(null)
    }
  }, [queryError])

  const artworks: Artwork[] = data?.pages.flatMap((p) => p.artworks) ?? []
  const hasFilters = Object.values(filters).some(Boolean)

  const handleRetry = useCallback(() => {
    setFetchError(null)
    refetch()
  }, [refetch])

  const handlePurchase = useCallback(
    async (artwork: Artwork) => {
      try {
        // Purchase flow handled by wallet/contract integration
        console.log('Purchase initiated for', artwork.id)
      } catch (error) {
        showError(error)
      }
    },
    [showError]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Explore Artwork</h1>
          <p className="text-gray-600 mt-1">
            Discover AI-generated art from creators around the world
          </p>
        </div>

        {fetchError && (
          <ErrorDisplay
            error={fetchError}
            onRetry={handleRetry}
            onDismiss={() => setFetchError(null)}
            className="mb-6"
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <ArtworkGrid
              artworks={artworks}
              isLoading={isLoading}
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
              onPurchase={handlePurchase}
              onClearFilters={() => setFilters({})}
              hasFilters={hasFilters}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

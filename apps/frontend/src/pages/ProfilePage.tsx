import { useState } from 'react'
import { Settings, Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Grid } from '@/components/layout/Grid'
import { ArtworkCard } from '@/components/artwork/ArtworkCard'
import { ArtworkCardSkeleton } from '@/components/ArtworkCardSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { useUserProfile, useUserArtworks } from '@/services/artworkService'
import { useStellar } from '@/hooks/useStellar'

type ActiveTab = 'created' | 'favorites'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('created')

  const { account } = useStellar()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: artworks, isLoading: artworksLoading } = useUserArtworks(
    account.publicKey || profile?.address || ''
  )

  const displayAddress = account.publicKey || profile?.address || '—'
  const displayName = profile?.username || 'Artist'
  const stats = profile?.stats ?? { created: 0, collected: 0, favorites: 0 }

  const shortAddress =
    displayAddress.length > 12
      ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
      : displayAddress

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <Card padding="lg" className="text-center">
            {/* Avatar + info: horizontal on mobile, vertical on lg */}
            <div className="flex flex-row items-center gap-4 lg:flex-col lg:gap-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full shrink-0 lg:mx-auto lg:mb-4 flex items-center justify-center">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-2xl lg:text-3xl">🎨</span>
                )}
              </div>

              <div className="flex-1 text-left lg:text-center">
                {profileLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-5 bg-secondary-200 rounded w-32" />
                    <div className="h-4 bg-secondary-100 rounded w-24" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">{displayName}</h2>
                    <p className="text-secondary-600 text-xs sm:text-sm font-mono lg:mb-4">{shortAddress}</p>
                  </>
                )}
              </div>
            </div>

            {/* Stats: horizontal row on mobile, vertical list on lg */}
            <div className="mt-4 lg:mt-0">
              <div className="flex justify-around gap-2 sm:gap-4 lg:block lg:space-y-2 text-sm border-t border-secondary-100 pt-4 lg:border-0 lg:pt-0">
                {[
                  { label: 'Created', value: stats.created },
                  { label: 'Collected', value: stats.collected },
                  { label: 'Favorites', value: stats.favorites },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center lg:flex-row lg:justify-between">
                    <span className="text-secondary-600 text-xs sm:text-sm">{label}</span>
                    <span className="font-medium text-sm sm:text-base">
                      {profileLoading ? '—' : value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 sm:mt-6">
                <Button variant="outline" size="md" fullWidth>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Main content ── */}
        <div className="lg:col-span-3">
          <div className="space-y-4 sm:space-y-8">
            {/* Tab bar */}
            <div className="flex items-center space-x-4 sm:space-x-6 border-b border-secondary-100">
              {[
                { key: 'created', label: 'Created', icon: ShoppingBag },
                { key: 'favorites', label: 'Favorites', icon: Heart },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`flex items-center space-x-2 font-medium pb-2 border-b-2 -mb-px transition-colors touch-manipulation text-sm sm:text-base ${
                    activeTab === key
                      ? 'text-primary-600 border-primary-600'
                      : 'text-secondary-600 border-transparent'
                  }`}
                  onClick={() => setActiveTab(key as ActiveTab)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Artwork grid */}
            {activeTab === 'created' && (
              <>
                {artworksLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ArtworkCardSkeleton key={i} />
                    ))}
                  </div>
                ) : artworks && artworks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    {artworks.map((artwork) => (
                      <ArtworkCard
                        key={artwork.id}
                        artwork={artwork}
                        variant="default"
                        showPrice
                        showCreator={false}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState type="no-artworks" />
                )}
              </>
            )}

            {activeTab === 'favorites' && (
              <EmptyState type="no-favorites" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
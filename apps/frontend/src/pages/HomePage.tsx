import { Button } from '@/components/ui/Button'
import { Grid } from '@/components/layout/Grid'
import { ArtworkCard } from '@/components/artwork/ArtworkCard'

// Mock data for demonstration
const mockArtworks = Array.from({ length: 6 }, (_, i) => ({
  id: `mock-${i + 1}`,
  title: `AI Artwork #${i + 1}`,
  description: 'Generated with AI Model',
  imageUrl: `https://picsum.photos/600/600?random=${i + 1}`,
  price: '0.1',
  currency: 'ETH',
  creator: `Artist ${i + 1}`
}))

export function HomePage() {
  const handleArtworkView = (artwork: typeof mockArtworks[0]) => {
    console.log('View artwork:', artwork)
  }

  const handleArtworkPurchase = (artwork: typeof mockArtworks[0]) => {
    console.log('Purchase artwork:', artwork)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-section">
        <div className="text-center space-y-6">
          <h1 className="heading-mobile text-center">
            Discover AI-Generated
            <span className="block text-primary-600">Digital Art</span>
          </h1>
          
          <p className="text-mobile-base text-secondary-600 mobile-container">
            Explore, collect, and create unique AI-generated artworks on the blockchain. 
            Each piece is a one-of-a-kind digital collectible.
          </p>
          
          <div className="flex flex-col gap-3 mobile-container">
            <Button variant="primary" size="md" fullWidth>
              Start Exploring
            </Button>
            <Button variant="outline" size="md" fullWidth>
              Create Art
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mobile-section">
        <h2 className="subheading-mobile mb-6">Featured Artworks</h2>
        <Grid responsive gap="md">
          {mockArtworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              variant="default"
              onView={handleArtworkView}
              onPurchase={handleArtworkPurchase}
              showPrice={true}
              showCreator={false}
            />
          ))}
        </Grid>
      </div>
    </div>
  )
}

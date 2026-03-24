import { useState } from 'react'
import { Sparkles, Image as ImageIcon } from 'lucide-react'
import { ErrorHandler, AppError } from '@/utils/errorHandler'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export function MintPage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<AppError | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setError(null)
    setIsGenerating(true)
    try {
      // AI image generation logic will be implemented
      console.log('Generating image for prompt:', prompt)
      setTimeout(() => {
        setGeneratedImage(`https://picsum.photos/512/512?random=${Date.now()}`)
        setIsGenerating(false)
      }, 3000)
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      setError(appError)
      setIsGenerating(false)
    }
  }

  const handleMint = async () => {
    if (!generatedImage) return
    
    setError(null)
    try {
      // NFT minting logic will be implemented
      console.log('Minting NFT...')
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      setError(appError)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">Create AI Art</h1>
      
      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          showRetry={error.isRecoverable}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Describe your artwork
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cityscape at sunset with flying cars and neon lights..."
              className="input w-full h-32 resize-none"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Artwork</span>
              </>
            )}
          </button>
          
          {generatedImage && (
            <div className="space-y-4">
              <h3 className="font-semibold text-secondary-900">Generated Artwork</h3>
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden">
                <OptimizedImage
                  src={generatedImage}
                  alt="Generated AI artwork"
                  className="w-full h-full object-cover"
                  width={512}
                  height={512}
                  placeholder="blur"
                />
              </div>
              
              <button
                onClick={handleMint}
                className="btn-primary w-full py-3"
              >
                Mint as NFT
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">AI Model Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Style</label>
                <select className="input w-full">
                  <option>Digital Art</option>
                  <option>Oil Painting</option>
                  <option>Watercolor</option>
                  <option>Photorealistic</option>
                  <option>Abstract</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Quality</label>
                <select className="input w-full">
                  <option>Standard</option>
                  <option>High</option>
                  <option>Ultra</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Minting Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Minting Fee</span>
                <span className="font-medium">0.01 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Creator Royalty</span>
                <span className="font-medium">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Network</span>
                <span className="font-medium">Ethereum</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

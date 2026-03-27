import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { Loading } from '@/components/ui/Loading'
import { useErrorContext } from '@/contexts/ErrorContext'
import { aiService, type GenerateImageRequest, type GenerationStatus } from '@/services/aiService'
import { type AppError } from '@/utils/errorHandler'
import { Wand2, RefreshCw } from 'lucide-react'

type MintStep = 'prompt' | 'generating' | 'preview' | 'minting' | 'done'

export function MintPage() {
  const { showError } = useErrorContext()

  const [step, setStep] = useState<MintStep>('prompt')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [generationError, setGenerationError] = useState<AppError | null>(null)
  const [mintError, setMintError] = useState<AppError | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setGenerationError(null)
    setIsSubmitting(true)
    setStep('generating')

    const request: GenerateImageRequest = {
      prompt: prompt.trim(),
      style: style || undefined,
      quality: 'standard',
    }

    try {
      const { generationId } = await aiService.generateImage(request)
      const finalStatus = await aiService.pollGenerationStatus(
        generationId,
        (status) => setGenerationStatus(status)
      )
      setGenerationStatus(finalStatus)
      setStep('preview')
    } catch (error: unknown) {
      const { ErrorHandler } = await import('@/utils/errorHandler')
      const appError = ErrorHandler.handle(error)
      setGenerationError(appError)
      setStep('prompt')
    } finally {
      setIsSubmitting(false)
    }
  }, [prompt, style])

  const handleMint = useCallback(async () => {
    setMintError(null)
    setIsSubmitting(true)
    setStep('minting')
    try {
      // Wallet / contract minting would be called here
      await new Promise((res) => setTimeout(res, 1500))
      setStep('done')
    } catch (error: unknown) {
      const { ErrorHandler } = await import('@/utils/errorHandler')
      const appError = ErrorHandler.handle(error)
      setMintError(appError)
      showError(error)
      setStep('preview')
    } finally {
      setIsSubmitting(false)
    }
  }, [showError])

  const handleReset = useCallback(() => {
    setStep('prompt')
    setGenerationError(null)
    setMintError(null)
    setGenerationStatus(null)
    setPrompt('')
    setStyle('')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mint Artwork</h1>
          <p className="text-gray-600 mt-1">
            Generate AI art and mint it as an NFT on the Stellar blockchain
          </p>
        </div>

        {/* Step: Prompt */}
        {(step === 'prompt' || step === 'generating') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {generationError && (
              <ErrorDisplay
                error={generationError}
                onRetry={handleGenerate}
                onDismiss={() => setGenerationError(null)}
              />
            )}

            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Describe your artwork
              </label>
              <textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={step === 'generating'}
                placeholder="A vibrant abstract landscape with swirling blues and golds…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="style"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Style (optional)
              </label>
              <input
                id="style"
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={step === 'generating'}
                placeholder="e.g. oil painting, watercolor, pixel art"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {step === 'generating' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loading variant="spinner" size="lg" />
                <p className="text-sm text-gray-600">
                  {generationStatus
                    ? `Generating… ${generationStatus.progress}%`
                    : 'Starting generation…'}
                </p>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Wand2 size={18} />}
                onClick={handleGenerate}
                disabled={!prompt.trim()}
              >
                Generate Artwork
              </Button>
            )}
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && generationStatus?.imageUrl && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {mintError && (
              <ErrorDisplay
                error={mintError}
                onRetry={handleMint}
                onDismiss={() => setMintError(null)}
              />
            )}

            <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
              <img
                src={generationStatus.imageUrl}
                alt="Generated artwork preview"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm text-gray-500 italic">&ldquo;{prompt}&rdquo;</p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                leftIcon={<RefreshCw size={16} />}
                onClick={handleReset}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleMint}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Minting…' : 'Mint as NFT'}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Minting */}
        {step === 'minting' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center gap-4 py-12">
            <Loading variant="spinner" size="lg" />
            <p className="text-gray-600 text-sm">Submitting transaction to Stellar…</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-semibold text-gray-900">NFT Minted!</h2>
            <p className="text-gray-600 text-sm">
              Your artwork has been minted and is now on the Stellar blockchain.
            </p>
            <Button variant="primary" size="md" onClick={handleReset}>
              Mint Another
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

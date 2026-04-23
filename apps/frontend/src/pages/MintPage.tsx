import { useState, useEffect } from 'react'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { Button } from '@/components/ui/Button'
import { MintStepper } from '@/components/MintStepper'
import { useErrorContext } from '@/contexts/ErrorContext'
import { useWebSocket, useMintingUpdates, useWebSocketAuth } from '@/contexts/WebSocketContext'
import { ArtworkTransactionUpdates } from '@/components/Notifications/TransactionStatusIndicator'
import { aiService } from '@/services/aiService'
import { ErrorHandler, type AppError } from '@/utils/errorHandler'
import { ComponentErrorBoundary, AsyncErrorBoundary } from '@/components/error'

interface GenerateState {
    imageUrl: string | null
    generationId: string | null
    status: 'idle' | 'generating' | 'completed' | 'failed'
}

export function MintPage() {
    const { showError } = useErrorContext()
    const { isConnected } = useWebSocket()
    const { mintingUpdates } = useMintingUpdates()
    const { authenticate } = useWebSocketAuth()
    const [prompt, setPrompt] = useState('')
    const [style, setStyle] = useState('')
    const [error, setError] = useState<AppError | null>(null)
    const [state, setState] = useState<GenerateState>({
        imageUrl: null,
        generationId: null,
        status: 'idle',
    })

    useEffect(() => {
        // Authenticate WebSocket connection when user connects
        // This would typically get user data from auth context
        const userData = {
            // userId: user?.id, // Get from auth context
            // address: user?.walletAddress // Get from auth context
        }
        
        if (isConnected && (userData.userId || userData.address)) {
            authenticate(userData)
        }
    }, [isConnected, authenticate])

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError(
                ErrorHandler.handleError('Please enter a prompt before generating.', {
                    userMessage: 'Please enter a prompt to generate your artwork.',
                    context: 'MintPage.generate',
                })
            )
            return
        }

        setError(null)
        setState({ imageUrl: null, generationId: null, status: 'generating' })

        try {
            const generation = await aiService.generateImage({
                prompt: prompt.trim(),
                style: style.trim() || undefined,
            })

            const result = await aiService.pollGenerationStatus(generation.generationId)
            setState({
                imageUrl: result.imageUrl,
                generationId: generation.generationId,
                status: 'completed',
            })
        } catch (err) {
            setState((prev) => ({ ...prev, status: 'failed' }))
            showError(err)
            setError(
                ErrorHandler.handleError(err, {
                    context: 'MintPage.generate',
                    userMessage:
                        'We could not generate your artwork right now. Please try again, adjust your prompt, or come back in a moment.',
                })
            )
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Mint Artwork</h1>
                    <p className="text-gray-600 mt-1">
                        Generate your AI image, then complete minting with your wallet.
                    </p>
                </div>

                <section className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Generate Image</h2>

                    {error && (
                        <div className="mb-4 space-y-3">
                            <ErrorDisplay
                                error={error}
                                onRetry={handleGenerate}
                                onDismiss={() => setError(null)}
                                showRetry
                                showDismiss
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={handleGenerate}>
                                    Retry Generation
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setError(null)
                                        setState({ imageUrl: null, generationId: null, status: 'idle' })
                                    }}
                                >
                                    Edit Prompt
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Describe the artwork you want to generate..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Style (optional)</label>
                            <input
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g. surreal, cyberpunk, watercolor"
                            />

                            <div className="mt-4">
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={handleGenerate}
                                    disabled={state.status === 'generating'}
                                >
                                    {state.status === 'generating' ? 'Generating...' : 'Generate Artwork'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {state.imageUrl && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Generated preview</p>
                            <img
                                src={state.imageUrl}
                                alt="Generated artwork preview"
                                className="w-full max-h-96 object-contain rounded-md bg-gray-50"
                            />
                        </div>
                    )}
                </section>

                <section className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Mint on Blockchain</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Complete metadata, upload media, and sign transaction to mint your NFT.
                    </p>
                    
                    {/* Real-time minting updates */}
                    {mintingUpdates.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Minting Status Updates</h3>
                            <div className="space-y-2">
                                {mintingUpdates.slice(0, 3).map((update, index) => (
                                    <div key={index} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-blue-800">
                                                {update.data.status}
                                            </span>
                                            <span className="text-blue-600">
                                                {new Date(update.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {update.data.message && (
                                            <div className="text-blue-700 mt-1">
                                                {update.data.message}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <ComponentErrorBoundary 
                        name="MintStepper" 
                        showRetry={true}
                        showBack={true}
                        customMessage="The minting process encountered an error. Your artwork has not been minted yet."
                    >
                        <MintStepper />
                    </ComponentErrorBoundary>
                </section>
            </div>
        </div>
    )
}

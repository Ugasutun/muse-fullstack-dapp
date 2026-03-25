import { useState } from 'react'
import { MintStepper } from '@/components/MintStepper'
import { ErrorHandler, AppError } from '@/utils/errorHandler'
import { ErrorDisplay } from '@/components/ErrorDisplay'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

export function MintPage() {
  const [error, setError] = useState<AppError | null>(null)

  const handleMintComplete = (data: { metadata: any; fileData: any }) => {
    console.log('Minting completed:', data)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {error && (
          <div className="mb-4 sm:mb-6">
            <ErrorDisplay
              error={error}
              onDismiss={() => setError(null)}
              showRetry={error.isRecoverable}
            />
          </div>
        )}

        <MintStepper onComplete={handleMintComplete} />
      </div>
    </div>
  )
}
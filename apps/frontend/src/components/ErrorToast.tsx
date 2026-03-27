import React from 'react'
import { useErrorContext } from '@/contexts/ErrorContext'
import { ToastError } from '@/components/ErrorDisplay'

/**
 * Renders all active errors from ErrorContext as stacked toast notifications.
 * Mount this once at the app root (inside ErrorProvider).
 */
export function ErrorToastContainer() {
  const { errors, removeError } = useErrorContext()

  if (errors.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Error notifications"
    >
      {errors.map((error) => (
        <ToastError
          key={error.id}
          error={error}
          onDismiss={() => error.id && removeError(error.id)}
          autoDismiss={error.isRecoverable !== false}
        />
      ))}
    </div>
  )
}

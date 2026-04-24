import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface LoadingState {
  isLoading: boolean
  message?: string
  variant?: 'spinner' | 'dots' | 'bars'
  progress?: number
}

export interface LoadingContextType {
  globalLoading: LoadingState
  setGlobalLoading: (loading: Partial<LoadingState>) => void
  operations: Record<string, LoadingState>
  setOperationLoading: (operation: string, loading: Partial<LoadingState>) => void
  clearOperationLoading: (operation: string) => void
  isAnyOperationLoading: () => boolean
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [globalLoading, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false
  })
  const [operations, setOperations] = useState<Record<string, LoadingState>>({})

  const setGlobalLoading = (loading: Partial<LoadingState>) => {
    setGlobalLoadingState(prev => ({ ...prev, ...loading }))
  }

  const setOperationLoading = (operation: string, loading: Partial<LoadingState>) => {
    setOperations(prev => ({
      ...prev,
      [operation]: { ...prev[operation], ...loading }
    }))
  }

  const clearOperationLoading = (operation: string) => {
    setOperations(prev => {
      const newOps = { ...prev }
      delete newOps[operation]
      return newOps
    })
  }

  const isAnyOperationLoading = () => {
    return Object.values(operations).some(op => op.isLoading)
  }

  return (
    <LoadingContext.Provider
      value={{
        globalLoading,
        setGlobalLoading,
        operations,
        setOperationLoading,
        clearOperationLoading,
        isAnyOperationLoading
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Hook for specific operations
export function useOperationLoading(operationName: string) {
  const { setOperationLoading, clearOperationLoading, operations } = useLoading()
  
  const startLoading = (message?: string, variant?: LoadingState['variant']) => {
    setOperationLoading(operationName, {
      isLoading: true,
      message,
      variant
    })
  }
  
  const stopLoading = () => {
    clearOperationLoading(operationName)
  }
  
  const updateProgress = (progress: number, message?: string) => {
    setOperationLoading(operationName, {
      isLoading: true,
      progress,
      message
    })
  }
  
  const isLoading = operations[operationName]?.isLoading || false
  const currentLoading = operations[operationName]
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    updateProgress,
    currentLoading
  }
}

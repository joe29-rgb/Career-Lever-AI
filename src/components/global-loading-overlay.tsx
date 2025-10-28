'use client'

import { useAppStore } from '@/stores/app.store'
import { Loader2 } from 'lucide-react'

export function GlobalLoadingOverlay() {
  const globalLoading = useAppStore((state) => state.globalLoading)
  const loadingMessage = useAppStore((state) => state.loadingMessage)
  
  if (!globalLoading) return null
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-2xl flex flex-col items-center gap-4 border border-border">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {loadingMessage || 'Loading...'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please wait a moment
          </p>
        </div>
      </div>
    </div>
  )
}

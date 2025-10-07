'use client'

import React from 'react'
import { ErrorBoundary } from '../error-boundary'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardErrorFallbackProps {
  error: Error
  retry: () => void
  errorId: string
}

function DashboardErrorFallback({ error, retry, errorId }: DashboardErrorFallbackProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Dashboard Error</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Error ID: {errorId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">What happened?</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <p className="text-sm font-medium mb-2">💡 Suggestions:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Check your internet connection</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={retry} className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={DashboardErrorFallback}
      isolate={false} // Allow errors to propagate if needed
    >
      {children}
    </ErrorBoundary>
  )
}


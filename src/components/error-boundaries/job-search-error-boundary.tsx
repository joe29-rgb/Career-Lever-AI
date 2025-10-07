'use client'

import React from 'react'
import { ErrorBoundary } from '../error-boundary'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { SearchX, RefreshCcw, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JobSearchErrorFallbackProps {
  error: Error
  retry: () => void
  errorId: string
}

function JobSearchErrorFallback({ error, retry, errorId }: JobSearchErrorFallbackProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
              <SearchX className="h-6 w-6 text-warning" />
            </div>
            <div>
              <CardTitle>Job Search Error</CardTitle>
              <CardDescription className="text-xs">Error ID: {errorId}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">What went wrong:</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </div>

          <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
            <p className="text-sm font-medium mb-2">💡 Quick Fixes:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Try simplifying your search terms</li>
              <li>Check your internet connection</li>
              <li>Wait a moment and try again</li>
              <li>Contact support with the error ID above</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={retry} size="sm" className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry Search
            </Button>
            <Button onClick={() => router.back()} size="sm" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function JobSearchErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={JobSearchErrorFallback}
      isolate={true} // Isolate errors to this section only
    >
      {children}
    </ErrorBoundary>
  )
}


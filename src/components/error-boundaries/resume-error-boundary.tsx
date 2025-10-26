'use client'

import React from 'react'
import { ErrorBoundary } from '../error-boundary'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { FileX, RefreshCcw, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResumeErrorFallbackProps {
  error: Error
  retry: () => void
  errorId: string
}

function ResumeErrorFallback({ error, retry, errorId }: ResumeErrorFallbackProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <FileX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Resume Processing Error</CardTitle>
              <CardDescription className="text-xs">Error ID: {errorId}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Error Details:</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </div>

          <div className="bg-accent/10 p-3 rounded-md border border-accent/20">
            <p className="text-sm font-medium mb-2 text-accent-foreground">💡 Try This:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ensure your PDF is not corrupted or password-protected</li>
              <li>Try converting your resume to a standard PDF format</li>
              <li>Upload a smaller file size (&lt; 10MB)</li>
              <li>Use the "Paste Text" option as an alternative</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={retry} size="sm" className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => router.push('/career-finder/resume')} size="sm" variant="outline" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Upload New
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ResumeErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={ResumeErrorFallback}
      isolate={true} // Isolate errors to prevent full page crashes
    >
      {children}
    </ErrorBoundary>
  )
}


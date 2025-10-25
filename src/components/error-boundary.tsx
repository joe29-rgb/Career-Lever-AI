'use client'
import React from 'react'
import { logger, securityLogger } from '@/lib/logger'
import { errorTracker } from '@/lib/error-tracking'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void; errorId: string }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  isolate?: boolean // If true, error won't propagate to parent boundaries
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
  errorCount: number
}

export class ErrorBoundary extends React.Component<Props, State> {
  private resetTimeout?: NodeJS.Timeout

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorId, errorCount } = this.state
    
    // Track error in error tracking service
    errorTracker.trackError(error, {
      context: 'react-error-boundary',
      severity: 'high',
      tags: ['ui', 'react'],
      metadata: {
        errorId,
        errorCount,
        componentStack: errorInfo.componentStack
      }
    })
    
    // Log error with full context
    logger.error('React Error Boundary caught error', {
      errorId,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: errorCount + 1,
      timestamp: new Date().toISOString()
    })

    // Update error count
    this.setState(prev => ({
      errorCount: prev.errorCount + 1
    }))

    // Security logging for suspicious patterns
    if (error.message.includes('script') || error.message.includes('injection')) {
      securityLogger.securityEvent('Suspicious error pattern detected', 'high', {
        errorId,
        errorMessage: error.message,
        componentStack: errorInfo.componentStack
      })
    }

    // Send to external error tracking (Sentry, etc.)
    this.reportToExternalService(error, errorInfo, errorId)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Prevent error cascade - reset after 5 seconds if error persists
    if (errorCount > 3) {
      logger.warn('Error boundary hit multiple times, forcing reload', {
        errorId,
        errorCount
      })
      
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout)
      }
      
      this.resetTimeout = setTimeout(() => {
        window.location.reload()
      }, 5000)
    }
  }

  private reportToExternalService(error: Error, errorInfo: React.ErrorInfo, errorId?: string) {
    // Sentry integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
            errorId
          }
        }
      })
    }

    // Custom error reporting endpoint
    if (process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(err => {
        console.error('Failed to report error:', err)
      })
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }
  }

  private handleRetry = () => {
    logger.info('User initiated error boundary retry', {
      errorId: this.state.errorId
    })
    
    this.setState({ 
      hasError: false,
      error: undefined,
      errorId: undefined
    })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return (
        <Fallback 
          error={this.state.error!} 
          retry={this.handleRetry}
          errorId={this.state.errorId!}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback = ({ 
  error, 
  retry, 
  errorId 
}: { 
  error: Error
  retry: () => void
  errorId: string
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl w-full bg-card shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Something went wrong</h2>
              <p className="text-red-100 text-sm">
                We apologize for the inconvenience. Our team has been notified.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Error Details</h3>
            <p className="text-red-700 text-sm font-mono break-words">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Error ID */}
          <div className="bg-gray-50 border border-border rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-1">Error ID (for support)</h3>
            <code className="text-xs text-gray-800 font-mono select-all">
              {errorId}
            </code>
          </div>

          {/* Stack Trace (Development Only) */}
          {isDevelopment && error.stack && (
            <details className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
              <summary className="cursor-pointer p-4 hover:bg-gray-800 font-semibold text-sm">
                Stack Trace (Development)
              </summary>
              <pre className="p-4 text-xs overflow-x-auto">
                <code>{error.stack}</code>
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={retry}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
            >
              Go to Home
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>If this problem persists, please contact support with the Error ID above.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

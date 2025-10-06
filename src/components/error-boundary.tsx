'use client'
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // Log to Sentry if configured
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback error={this.state.error!} retry={() => this.setState({ hasError: false })} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button onClick={retry} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
        Try again
      </button>
    </div>
  </div>
)

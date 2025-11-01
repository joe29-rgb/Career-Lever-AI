/**
 * LOADING SPINNER COMPONENT
 * Reusable spinner for loading states
 */

import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  }

  return (
    <div
      className={cn(
        'loading-spinner animate-spin rounded-full border-current border-r-transparent',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function LoadingButton({
  children,
  isLoading,
  loadingText = 'Loading...',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  isLoading?: boolean
  loadingText?: string
}) {
  return (
    <button 
      {...props} 
      disabled={isLoading || props.disabled}
      className={cn(
        isLoading && 'btn-loading',
        className
      )}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Full page loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        background: 'rgba(var(--color-charcoal-900-rgb), 0.8)',
        backdropFilter: 'blur(4px)'
      }}
      role="alert"
      aria-busy="true"
      aria-label={message}
    >
      <div 
        className="flex flex-col items-center gap-4 p-8 rounded-lg"
        style={{ background: 'var(--color-surface)' }}
      >
        <Spinner size="lg" />
        <p style={{ color: 'var(--color-text)' }} className="font-medium">
          {message}
        </p>
      </div>
    </div>
  )
}

// Inline loading state for content areas
export function LoadingState({ 
  message = 'Loading...', 
  className = '' 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div 
      className={cn('flex flex-col items-center justify-center py-12', className)}
      role="status"
      aria-label={message}
    >
      <Spinner size="lg" />
      <p 
        className="mt-4 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {message}
      </p>
    </div>
  )
}

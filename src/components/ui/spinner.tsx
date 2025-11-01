/**
 * LOADING SPINNER COMPONENT - Production Ready
 * Path: src/components/ui/loading-spinner.tsx
 */

import React, { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-4'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-current border-r-transparent',
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

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function LoadingButton({
  children,
  isLoading,
  loadingText = 'Loading...',
  className,
  variant = 'primary',
  ...props
}: LoadingButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost'
  }

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        'btn',
        variantClasses[variant],
        isLoading && 'cursor-wait',
        className
      )}
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

// Bonus: Inline spinner for custom buttons
export function ButtonSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('mr-2', className)} />
}

'use client'

import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export interface FormFeedbackProps {
  type: 'error' | 'success' | 'info'
  message: string
  className?: string
}

export function FormFeedback({ type, message, className = '' }: FormFeedbackProps) {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  }

  const Icon = icons[type]

  return (
    <div 
      className={`form-${type} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}

// Form group wrapper with validation
export function FormGroup({
  label,
  error,
  success,
  required = false,
  children,
  className = '',
}: {
  label: string
  error?: string
  success?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`form-group ${className}`}>
      <label 
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--color-text)' }}
      >
        {label}
        {required && (
          <span 
            className="ml-1"
            style={{ color: 'var(--color-error)' }}
            aria-label="required"
          >
            *
          </span>
        )}
      </label>
      {children}
      {error && <FormFeedback type="error" message={error} />}
      {success && <FormFeedback type="success" message={success} />}
    </div>
  )
}

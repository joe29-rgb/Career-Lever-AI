/**
 * FORM FEEDBACK - Production Ready
 * Path: src/components/ui/form-feedback.tsx
 * Visual validation feedback for forms
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type FeedbackType = 'success' | 'error' | 'warning' | 'info'

interface FormFeedbackProps {
  type: FeedbackType
  message: string
  icon?: string
  className?: string
  onClose?: () => void
}

export function FormFeedback({
  type,
  message,
  icon,
  className,
  onClose,
}: FormFeedbackProps) {
  const styles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-700 dark:text-green-400',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-700 dark:text-red-400',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '⚠',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'ℹ',
    },
  }

  const style = styles[type]
  const displayIcon = icon || style.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl',
        'border-l-4 border border-transparent',
        style.bg,
        style.border,
        style.text,
        className
      )}
      role="alert"
    >
      <span className="text-lg font-bold flex-shrink-0">{displayIcon}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  )
}

/**
 * FORM FIELD - Input with validation feedback
 */
interface FormFieldProps {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  success?: boolean
  hint?: string
  required?: boolean
  className?: string
}

export function FormField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  success,
  hint,
  required,
  className,
}: FormFieldProps) {
  const hasError = !!error
  const showSuccess = success && !hasError

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'modern-input',
          hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
        )}
        aria-invalid={hasError}
        aria-describedby={hasError ? 'error-message' : undefined}
      />

      {hint && !hasError && !showSuccess && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {hasError && (
        <p id="error-message" className="text-xs text-red-600 font-medium">
          ✕ {error}
        </p>
      )}

      {showSuccess && (
        <p className="text-xs text-green-600 font-medium">
          ✓ Looks good!
        </p>
      )}
    </div>
  )
}

/**
 * VALIDATION GROUP - Multiple fields with feedback
 */
interface ValidationGroupProps {
  title: string
  fields: Array<{
    id: string
    label: string
    value: string
    error?: string
    success?: boolean
  }>
  onFieldChange: (id: string, value: string) => void
}

export function ValidationGroup({
  title,
  fields,
  onFieldChange,
}: ValidationGroupProps) {
  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      <div className="space-y-4">
        {fields.map((field) => (
          <FormField
            key={field.id}
            label={field.label}
            value={field.value}
            onChange={(value) => onFieldChange(field.id, value)}
            error={field.error}
            success={field.success}
          />
        ))}
      </div>
    </div>
  )
}

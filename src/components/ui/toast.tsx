'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  type?: ToastType
  message: string
  icon?: React.ReactNode
  autoDismiss?: number
  onClose?: () => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

export function Toast({ 
  type = 'info', 
  message, 
  icon, 
  autoDismiss = 3000,
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = icon || toastIcons[type]

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onClose])

  if (!isVisible) return null

  return (
    <div 
      className={`toast toast--${type}`}
      role="alert"
      aria-live="polite"
    >
      {typeof Icon === 'function' ? (
        <Icon className="w-5 h-5 flex-shrink-0" />
      ) : (
        Icon
      )}
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast Container for managing multiple toasts
export function ToastContainer({ 
  toasts 
}: { 
  toasts: Array<ToastProps & { id: string }> 
}) {
  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const showToast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...props, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    showToast,
    removeToast,
    success: (message: string) => showToast({ type: 'success', message }),
    error: (message: string) => showToast({ type: 'error', message }),
    warning: (message: string) => showToast({ type: 'warning', message }),
    info: (message: string) => showToast({ type: 'info', message }),
  }
}

/**
 * EMPTY STATE COMPONENT
 * Beautiful empty states for lists and sections
 */

import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && (
        <div className="empty-state__icon">
          <Icon className="w-16 h-16" />
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {description && (
        <p className="empty-state__description">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

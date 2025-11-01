'use client'

import { FileText, Mail, Briefcase, Search } from 'lucide-react'

export interface PreviewEmptyProps {
  icon?: 'document' | 'email' | 'job' | 'search' | React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const icons = {
  document: FileText,
  email: Mail,
  job: Briefcase,
  search: Search,
}

export function PreviewEmpty({ 
  icon = 'document',
  title = 'No preview available',
  description = 'Complete the form to see a preview',
  action,
  className = ''
}: PreviewEmptyProps) {
  const IconComponent = typeof icon === 'string' ? icons[icon] : null

  return (
    <div className={`preview-empty ${className}`}>
      <div className="preview-empty__icon">
        {IconComponent ? (
          <IconComponent className="w-16 h-16" style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          icon
        )}
      </div>
      <h3 
        className="text-xl font-semibold mb-2"
        style={{ color: 'var(--color-text)' }}
      >
        {title}
      </h3>
      <p 
        className="text-sm mb-6"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

// Wrapper for preview containers
export function PreviewContainer({ 
  children, 
  isEmpty = false,
  emptyState,
  className = ''
}: {
  children: React.ReactNode
  isEmpty?: boolean
  emptyState?: PreviewEmptyProps
  className?: string
}) {
  return (
    <div className={`preview-container ${className}`}>
      {isEmpty && emptyState ? (
        <PreviewEmpty {...emptyState} />
      ) : (
        children
      )}
    </div>
  )
}

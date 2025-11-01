'use client'

import { ThumbsUp, ThumbsDown, CheckCircle, AlertCircle } from 'lucide-react'

export interface CompanyResearchData {
  pros?: string[]
  cons?: string[]
}

export interface CompanyResearchCardProps {
  data: CompanyResearchData
  className?: string
}

export function CompanyResearchCard({ data, className = '' }: CompanyResearchCardProps) {
  const { pros = [], cons = [] } = data

  return (
    <div className={`company-research ${className}`}>
      {/* Pros Card */}
      {pros.length > 0 && (
        <div className="company-card company-card--pros">
          <h4>
            <ThumbsUp className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
            <span>Pros</span>
          </h4>
          <ul>
            {pros.map((pro, index) => (
              <li key={index}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cons Card */}
      {cons.length > 0 && (
        <div className="company-card company-card--cons">
          <h4>
            <ThumbsDown className="w-6 h-6" style={{ color: 'var(--color-warning)' }} />
            <span>Cons</span>
          </h4>
          <ul>
            {cons.map((con, index) => (
              <li key={index}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Single card variant for more flexibility
export function CompanyCard({ 
  type, 
  title, 
  items 
}: { 
  type: 'pros' | 'cons'
  title: string
  items: string[]
}) {
  const Icon = type === 'pros' ? ThumbsUp : ThumbsDown
  const ItemIcon = type === 'pros' ? CheckCircle : AlertCircle
  const colorVar = type === 'pros' ? 'var(--color-success)' : 'var(--color-warning)'

  return (
    <div className={`company-card company-card--${type}`}>
      <h4>
        <Icon className="w-6 h-6" style={{ color: colorVar }} />
        <span>{title}</span>
      </h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <ItemIcon className="w-4 h-4 flex-shrink-0" style={{ color: colorVar }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

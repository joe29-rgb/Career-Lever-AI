/**
 * COMPANY RESEARCH CARD - Production Ready
 * Path: src/components/ui/company-research-card.tsx
 * Display company pros/cons with beautiful cards
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CompanyResearchCardProps {
  title: string
  type: 'pros' | 'cons'
  items: string[]
  icon?: string
  className?: string
}

export function CompanyResearchCard({
  title,
  type,
  items,
  icon,
  className,
}: CompanyResearchCardProps) {
  const isPros = type === 'pros'

  // Color schemes
  const colorScheme = isPros
    ? {
        bgLight: 'bg-green-50',
        bgDark: 'bg-green-500/10',
        border: 'border-green-200 dark:border-green-500/30',
        text: 'text-green-900 dark:text-green-400',
        labelBg: 'bg-green-100 dark:bg-green-500/20',
        labelText: 'text-green-700 dark:text-green-400',
        iconColor: 'text-green-600 dark:text-green-400',
      }
    : {
        bgLight: 'bg-yellow-50',
        bgDark: 'bg-yellow-500/10',
        border: 'border-yellow-200 dark:border-yellow-500/30',
        text: 'text-yellow-900 dark:text-yellow-400',
        labelBg: 'bg-yellow-100 dark:bg-yellow-500/20',
        labelText: 'text-yellow-700 dark:text-yellow-400',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
      }

  const defaultIcon = isPros ? '✓' : '⚠'

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 transition-all',
        colorScheme.bgDark,
        colorScheme.border,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn('text-2xl', colorScheme.iconColor)}>
          {icon || defaultIcon}
        </span>
        <h3 className={cn('text-lg font-semibold', colorScheme.text)}>
          {title}
        </h3>
      </div>

      {/* Items List */}
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className={cn('flex gap-3 text-sm', colorScheme.text)}
          >
            <span className="font-bold flex-shrink-0">
              {isPros ? '+' : '−'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p className={cn('text-sm italic', colorScheme.text, 'opacity-75')}>
          No {type} listed yet
        </p>
      )}
    </div>
  )
}

/**
 * COMPANY RESEARCH GRID - Container for multiple cards
 */
interface CompanyResearchGridProps {
  pros: string[]
  cons: string[]
  className?: string
}

export function CompanyResearchGrid({
  pros,
  cons,
  className,
}: CompanyResearchGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 gap-6',
        className
      )}
    >
      <CompanyResearchCard
        title="Pros"
        type="pros"
        items={pros}
        icon="✓"
      />
      <CompanyResearchCard
        title="Cons"
        type="cons"
        items={cons}
        icon="⚠"
      />
    </div>
  )
}

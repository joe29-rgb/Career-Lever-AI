/**
 * SKELETON LOADER - Production Ready
 * Path: src/components/ui/skeleton.tsx
 * Loading placeholders with shimmer animation
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  baseColor?: string
}

/**
 * BASIC SKELETON - Generic loading box
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-muted via-muted/50 to-muted',
        'bg-[length:200%_100%] animate-shimmer',
        'rounded-md',
        className
      )}
    />
  )
}

/**
 * CARD SKELETON - Loading card placeholder
 */
export function CardSkeleton() {
  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex gap-3">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * TEXT SKELETON - Loading text line
 */
interface TextSkeletonProps {
  lines?: number
  className?: string
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-4/5' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

/**
 * JOB CARD SKELETON - Loading job card
 */
export function JobCardSkeleton() {
  return (
    <div className="card space-y-4">
      {/* Header with company logo */}
      <div className="flex gap-3">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Meta info */}
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Description */}
      <TextSkeleton lines={2} />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * GRID SKELETON - Multiple cards loading
 */
interface GridSkeletonProps {
  count?: number
  columns?: number
}

export function GridSkeleton({ count = 6, columns = 3 }: GridSkeletonProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * TABLE SKELETON - Loading table
 */
interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-5" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * LIST SKELETON - Loading list items
 */
interface ListSkeletonProps {
  count?: number
}

export function ListSkeleton({ count = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
          <TextSkeleton lines={1} className="flex-1 space-y-0" />
        </div>
      ))}
    </div>
  )
}

/**
 * PROFILE SKELETON - Loading profile card
 */
export function ProfileSkeleton() {
  return (
    <div className="card text-center space-y-4">
      {/* Avatar */}
      <Skeleton className="w-24 h-24 rounded-full mx-auto" />

      {/* Name and title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>

      {/* Bio */}
      <TextSkeleton lines={2} className="mx-auto max-w-xs" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 mx-auto w-8" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}



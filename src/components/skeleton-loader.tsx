/**
 * Skeleton Loader Component
 * Reusable loading skeleton for AI generation states
 */

'use client'

import { cn } from '@/lib/utils'

export interface SkeletonLoaderProps {
  lines?: number
  className?: string
  variant?: 'default' | 'card' | 'text'
}

export function SkeletonLoader({ 
  lines = 3, 
  className,
  variant = 'default'
}: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={cn("animate-pulse space-y-3", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
            style={{ width: `${Math.random() * 30 + 70}%` }}
          ></div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      ))}
    </div>
  )
}

/**
 * Resume Skeleton - for resume generation
 */
export function ResumeSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6 bg-card rounded-xl border">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      
      {/* Sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Cover Letter Skeleton - for cover letter generation
 */
export function CoverLetterSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6 bg-card rounded-xl border">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
      
      {/* Paragraphs */}
      <div className="space-y-4 mt-6">
        {[1, 2, 3].map((para) => (
          <div key={para} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        ))}
      </div>
      
      {/* Signature */}
      <div className="space-y-2 mt-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  )
}

/**
 * Email Skeleton - for email generation
 */
export function EmailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6 bg-card rounded-xl border">
      {/* Subject */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      
      {/* Body */}
      <div className="space-y-3 mt-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  )
}

/**
 * Job Analysis Skeleton - for job analysis
 */
export function JobAnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Match Score */}
      <div className="bg-card rounded-xl border p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      
      {/* Skills */}
      <div className="bg-card rounded-xl border p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          ))}
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="bg-card rounded-xl border p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Job Card Skeleton - for job search loading
 */
export function JobCardSkeleton() {
  return (
    <div className="gradient-border-card animate-pulse">
      <div className="p-6 space-y-4">
        {/* Company & Title */}
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        
        {/* Location & Salary */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        
        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          ))}
        </div>
        
        {/* Match Score */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        
        {/* Button */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
      </div>
    </div>
  )
}

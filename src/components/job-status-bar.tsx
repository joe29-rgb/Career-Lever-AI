/**
 * Job Status Bar Component
 * Figma-inspired status tabs for job tracking
 * 
 * Displays: Discover, Saved, Applied, Closed, Discarded
 */

'use client'

import { cn } from '@/lib/utils'

export type JobStatus = 'discover' | 'saved' | 'applied' | 'closed' | 'discarded'

interface JobStatusBarProps {
  activeStatus: JobStatus
  onStatusChange: (status: JobStatus) => void
  counts?: {
    discover?: number
    saved?: number
    applied?: number
    closed?: number
    discarded?: number
  }
}

const statusConfig = [
  { key: 'discover' as JobStatus, label: 'Discover' },
  { key: 'saved' as JobStatus, label: 'Saved' },
  { key: 'applied' as JobStatus, label: 'Applied' },
  { key: 'closed' as JobStatus, label: 'Closed' },
  { key: 'discarded' as JobStatus, label: 'Discarded' },
]

export function JobStatusBar({ activeStatus, onStatusChange, counts }: JobStatusBarProps) {
  return (
    <div className="relative w-full px-6 py-4">
      {/* Background Progress Bar */}
      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2 bg-[#D5D5D5] rounded-full" />
      
      {/* Status Tabs */}
      <div className="relative flex items-center justify-start gap-2 z-10">
        {statusConfig.map((status, index) => {
          const isActive = activeStatus === status.key
          const count = counts?.[status.key]
          
          return (
            <button
              key={status.key}
              onClick={() => onStatusChange(status.key)}
              className={cn(
                'flex items-center justify-center px-4 py-3 rounded-full font-semibold text-sm transition-all duration-300',
                'hover:scale-105 active:scale-95',
                isActive
                  ? 'bg-[#5424FD] text-white shadow-lg z-20'
                  : 'bg-[#D5D5D5] text-black hover:bg-[#BFBFBF] z-10'
              )}
              style={{
                order: index + 1,
                fontFamily: 'var(--font-inter), Satoshi, sans-serif',
              }}
            >
              {status.label}
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'ml-2 px-2 py-0.5 rounded-full text-xs font-bold',
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-black/10 text-black'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Compact version for mobile
 */
export function JobStatusBarCompact({ activeStatus, onStatusChange }: JobStatusBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {statusConfig.map((status) => {
        const isActive = activeStatus === status.key
        
        return (
          <button
            key={status.key}
            onClick={() => onStatusChange(status.key)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300',
              isActive
                ? 'bg-[#5424FD] text-white'
                : 'bg-[#D5D5D5] text-black'
            )}
          >
            {status.label}
          </button>
        )
      })}
    </div>
  )
}


/**
 * BATCH APPLY MODAL
 * UI for batch applying to multiple jobs
 */

'use client'

import { useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface Job {
  id: string
  title: string
  company: string
}

interface BatchApplyModalProps {
  jobs: Job[]
  isOpen: boolean
  onClose: () => void
  onApply: (jobIds: string[]) => Promise<void>
}

export function BatchApplyModal({ jobs, isOpen, onClose, onApply }: BatchApplyModalProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)

  const handleBatchApply = async () => {
    setIsApplying(true)
    setProgress(0)
    
    try {
      const jobIds = jobs.map(j => j.id)
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      await onApply(jobIds)
      
      clearInterval(interval)
      setProgress(100)
      
      // Mock results - replace with actual API response
      setResults({ success: jobs.length, failed: 0 })
      
      setTimeout(() => {
        onClose()
        setIsApplying(false)
        setProgress(0)
        setResults(null)
      }, 2000)
    } catch (error) {
      console.error('Batch apply failed:', error)
      setResults({ success: 0, failed: jobs.length })
      setIsApplying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">
            Apply to {jobs.length} Jobs
          </h2>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isApplying && !results && (
            <>
              <p className="mb-4 text-muted-foreground">
                You're about to apply to the following jobs:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBatchApply}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Apply to All
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {isApplying && !results && (
            <div className="text-center py-8">
              <Spinner size="lg" className="mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Applying to jobs...</p>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{progress}% complete</p>
            </div>
          )}

          {results && (
            <div className="text-center py-8">
              {results.success > 0 ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Success!</h3>
                  <p className="text-muted-foreground">
                    Applied to {results.success} job{results.success !== 1 ? 's' : ''} successfully
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Failed</h3>
                  <p className="text-muted-foreground">
                    Failed to apply to {results.failed} job{results.failed !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * JOB MATCH EXPLANATION - Production Ready
 * Path: src/components/ui/job-match-explanation.tsx
 * Shows why a job matches the user's profile
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface JobMatchExplanationProps {
  matchScore: number // 0-100
  matchedSkills: string[]
  missingSkills?: string[]
  reasons?: string[]
  className?: string
}

export function JobMatchExplanation({
  matchScore,
  matchedSkills,
  missingSkills = [],
  reasons = [],
  className,
}: JobMatchExplanationProps) {
  // Score color based on percentage
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  // Progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className={cn('card', className)}>
      {/* Header with Score */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Job Match Explanation
        </h3>

        {/* Match Score */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Match Score
          </span>
          <span className={cn('text-2xl font-bold', getScoreColor(matchScore))}>
            {matchScore}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(matchScore))}
            style={{ width: `${matchScore}%` }}
          />
        </div>
      </div>

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            ✓ Matched Skills ({matchedSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium border border-green-500/20"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            ◇ Skills to Learn ({missingSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-lg text-xs font-medium border border-yellow-500/20"
              >
                ◇ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reasons */}
      {reasons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Why This Match
          </h4>
          <ul className="space-y-2">
            {reasons.map((reason, index) => (
              <li
                key={index}
                className="flex gap-2 text-sm text-muted-foreground"
              >
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

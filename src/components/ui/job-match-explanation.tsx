'use client'

import { CheckCircle } from 'lucide-react'

export interface JobMatchData {
  matchScore: number
  skillsMatch: number
  experienceMatch: boolean
  matchedSkills: string[]
  reasons?: string[]
}

export interface JobMatchExplanationProps {
  data: JobMatchData
  className?: string
}

export function JobMatchExplanation({ data, className = '' }: JobMatchExplanationProps) {
  const { matchScore, skillsMatch, experienceMatch, matchedSkills, reasons } = data

  return (
    <div className={`job-match-explanation ${className}`}>
      <h4>Why we matched you:</h4>
      <ul>
        {reasons ? (
          reasons.map((reason, index) => (
            <li key={index}>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span>{reason}</span>
            </li>
          ))
        ) : (
          <>
            <li>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span>{skillsMatch}% of your top skills match</span>
            </li>
            {experienceMatch && (
              <li>
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                <span>Your experience level aligns perfectly</span>
              </li>
            )}
            <li>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span>You have {matchedSkills.length} required skills</span>
            </li>
          </>
        )}
      </ul>
      
      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Overall Match
          </span>
          <span className="match-score">{matchScore}% Match</span>
        </div>
        <div 
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--color-secondary)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${matchScore}%`,
              background: matchScore >= 80 
                ? 'var(--color-success)' 
                : matchScore >= 60 
                ? 'var(--color-warning)' 
                : 'var(--color-error)'
            }}
          />
        </div>
      </div>

      {/* Matched skills tags */}
      {matchedSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Matched Skills:
          </p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium rounded-full"
                style={{
                  background: 'rgba(var(--color-success-rgb), 0.1)',
                  color: 'var(--color-success)'
                }}
              >
                {skill}
              </span>
            ))}
            {matchedSkills.length > 5 && (
              <span
                className="px-3 py-1 text-xs font-medium rounded-full"
                style={{
                  background: 'var(--color-secondary)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                +{matchedSkills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

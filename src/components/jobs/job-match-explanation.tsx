/**
 * JOB MATCH EXPLANATION COMPONENT
 * Shows why a job matches the user's profile
 */

'use client'

import { CheckCircle } from 'lucide-react'

interface JobMatchExplanationProps {
  matchScore: number
  matchedSkills: string[]
  experienceMatch?: boolean
  locationMatch?: boolean
  salaryMatch?: boolean
}

export function JobMatchExplanation({
  matchScore,
  matchedSkills,
  experienceMatch = true,
  locationMatch = true,
  salaryMatch = true
}: JobMatchExplanationProps) {
  return (
    <div className="job-match-explanation">
      <h4 className="font-semibold mb-3">Why we matched you:</h4>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>{matchScore}% of your top skills match</span>
        </li>
        {experienceMatch && (
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Your experience level aligns perfectly</span>
          </li>
        )}
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>You have {matchedSkills.length} required skills</span>
        </li>
        {locationMatch && (
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Location matches your preferences</span>
          </li>
        )}
        {salaryMatch && (
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Salary meets your expectations</span>
          </li>
        )}
      </ul>
      
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${matchScore}%` }}
          />
        </div>
        <span className="match-score">{matchScore}% Match</span>
      </div>
      
      {matchedSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Matched Skills:</p>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.slice(0, 5).map(skill => (
              <span
                key={skill}
                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {matchedSkills.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                +{matchedSkills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

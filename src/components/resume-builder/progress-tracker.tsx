'use client'

import { CheckCircle, Circle } from 'lucide-react'

interface ProgressTrackerProps {
  resume: any
}

export function ProgressTracker({ resume }: ProgressTrackerProps) {
  const checks = [
    {
      label: 'Add your name and contact info',
      completed: !!resume.personalInfo?.fullName && !!resume.personalInfo?.email
    },
    {
      label: 'Add work experience',
      completed: resume.experience?.length > 0
    },
    {
      label: 'Add achievement bullets',
      completed: resume.experience?.some((exp: any) => exp.achievements?.length > 0)
    },
    {
      label: 'Add education',
      completed: resume.education?.length > 0
    },
    {
      label: 'Add at least 5 skills',
      completed: (resume.skills?.technical?.length || 0) + (resume.skills?.soft?.length || 0) >= 5
    },
    {
      label: 'Include numbers/metrics',
      completed: resume.experience?.some((exp: any) =>
        exp.achievements?.some((a: string) => /\d+/.test(a))
      )
    },
    {
      label: 'Add professional summary',
      completed: resume.personalInfo?.summary?.length >= 50
    }
  ]

  const completedCount = checks.filter(c => c.completed).length
  const progress = Math.round((completedCount / checks.length) * 100)

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-lg text-foreground">Resume Completeness</h4>
          <span className="text-2xl font-bold text-green-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              check.completed ? 'bg-green-100' : 'bg-white'
            }`}
          >
            {check.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                check.completed ? 'text-green-900 font-semibold' : 'text-gray-700'
              }`}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {progress >= 80 && (
        <div className="mt-4 p-4 bg-green-500 text-white rounded-lg text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold">Resume Ready!</p>
          <p className="text-sm opacity-90">Your resume looks great!</p>
        </div>
      )}
    </div>
  )
}

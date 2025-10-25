'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Zap, Loader2 } from 'lucide-react'

interface ATSIssue {
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  fix?: () => void
}

interface ATSAnalysis {
  score: number
  formatting: number
  keywords: number
  completeness: number
  issues: ATSIssue[]
}

interface ATSCheckerProps {
  resume: any
  onAutoFix?: (issue: ATSIssue) => void
}

export function ATSChecker({ resume, onAutoFix }: ATSCheckerProps) {
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (resume) {
      checkATS()
    }
  }, [resume])

  const checkATS = () => {
    setChecking(true)
    
    // Simulate ATS analysis
    setTimeout(() => {
      const issues: ATSIssue[] = []
      let score = 100

      // Check 1: Contact Information
      if (!resume.personalInfo?.email || !resume.personalInfo?.phone) {
        issues.push({
          severity: 'critical',
          title: 'Missing Contact Info',
          description: 'Add email and phone number for ATS compatibility'
        })
        score -= 20
      }

      // Check 2: Experience Section
      if (!resume.experience || resume.experience.length === 0) {
        issues.push({
          severity: 'critical',
          title: 'No Work Experience',
          description: 'Add at least one work experience entry'
        })
        score -= 15
      }

      // Check 3: Education Section
      if (!resume.education || resume.education.length === 0) {
        issues.push({
          severity: 'warning',
          title: 'No Education Listed',
          description: 'Add your educational background'
        })
        score -= 10
      }

      // Check 4: Skills Section
      const skillCount = (resume.skills?.technical?.length || 0) + (resume.skills?.soft?.length || 0)
      if (skillCount < 5) {
        issues.push({
          severity: 'warning',
          title: 'Low Keyword Count',
          description: 'Add more skills and keywords (minimum 5 recommended)'
        })
        score -= 10
      }

      // Check 5: Achievement Metrics
      const hasMetrics = resume.experience?.some((exp: any) =>
        exp.achievements?.some((a: string) => /\d+/.test(a))
      )
      if (!hasMetrics) {
        issues.push({
          severity: 'info',
          title: 'Missing Quantifiable Achievements',
          description: 'Add numbers, percentages, or metrics to show impact'
        })
        score -= 8
      }

      // Check 6: Summary
      if (!resume.personalInfo?.summary || resume.personalInfo.summary.length < 50) {
        issues.push({
          severity: 'info',
          title: 'Weak Professional Summary',
          description: 'Add a compelling summary (50+ characters recommended)'
        })
        score -= 5
      }

      setAnalysis({
        score: Math.max(0, score),
        formatting: 95,
        keywords: skillCount >= 10 ? 90 : skillCount >= 5 ? 70 : 40,
        completeness: resume.experience?.length > 0 && resume.education?.length > 0 ? 90 : 60,
        issues
      })
      setChecking(false)
    }, 1000)
  }

  if (checking) {
    return (
      <div className="bg-card rounded-xl border-2 border-border p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Analyzing ATS compatibility...</p>
      </div>
    )
  }

  if (!analysis) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-500'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-500'
    return 'text-red-600 bg-red-50 border-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Work'
  }

  return (
    <div className="bg-card rounded-xl border-2 border-border p-6 space-y-6">
      {/* Score Circle */}
      <div className="text-center">
        <div className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(analysis.score)}`}>
          <div className="text-4xl font-bold">{analysis.score}</div>
          <div className="text-sm font-semibold">ATS Score</div>
        </div>
        <p className="mt-3 text-lg font-semibold text-foreground">{getScoreLabel(analysis.score)}</p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">Formatting</span>
            <span className="font-semibold text-foreground">{analysis.formatting}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${analysis.formatting}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">Keywords</span>
            <span className="font-semibold text-foreground">{analysis.keywords}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                analysis.keywords >= 70 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${analysis.keywords}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">Completeness</span>
            <span className="font-semibold text-foreground">{analysis.completeness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                analysis.completeness >= 70 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${analysis.completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Issues Detected ({analysis.issues.length})
          </h4>
          {analysis.issues.map((issue, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border-l-4 ${
                issue.severity === 'critical'
                  ? 'bg-red-50 border-red-500'
                  : issue.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3">
                {issue.severity === 'critical' ? (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : issue.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h5 className="font-semibold text-foreground mb-1">{issue.title}</h5>
                  <p className="text-sm text-gray-700">{issue.description}</p>
                  {issue.fix && onAutoFix && (
                    <button
                      onClick={() => onAutoFix(issue)}
                      className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      ✨ Auto-Fix
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={checkATS}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-semibold"
      >
        🔄 Re-check ATS Score
      </button>
    </div>
  )
}

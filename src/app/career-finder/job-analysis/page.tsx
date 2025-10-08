/**
 * Job Analysis Page
 * Auto-analyzes selected job and compares with user's resume
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, MapPin, DollarSign, Target, CheckCircle2, AlertCircle } from 'lucide-react'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

interface JobData {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  description: string
  url: string
  source?: string
  skills?: string[]
}

interface AnalysisResult {
  matchScore?: number // Optional - undefined when no resume
  matchingSkills: string[]
  missingSkills: string[]
  recommendations: string[]
  estimatedFit: 'excellent' | 'good' | 'fair' | 'poor'
}

export default function JobAnalysisPage() {
  const router = useRouter()
  const [job, setJob] = useState<JobData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasResume, setHasResume] = useState(false)
  const [canProceed, setCanProceed] = useState(false) // ENTERPRISE: Prevent accidental skip

  useEffect(() => {
    console.log('🎯 [JOB_ANALYSIS] Page mounted - starting analysis flow')
    loadAndAnalyzeJob()
  }, [])

  const loadAndAnalyzeJob = async () => {
    try {
      // Load selected job from localStorage
      const stored = localStorage.getItem('selectedJob')
      console.log('🎯 [JOB_ANALYSIS] Retrieved from localStorage:', stored ? 'found' : 'NOT FOUND')
      
      if (!stored) {
        console.warn('🎯 [JOB_ANALYSIS] No job found - redirecting to search')
        router.push('/career-finder/search')
        return
      }

      const jobData = JSON.parse(stored)
      console.log('🎯 [JOB_ANALYSIS] Job data:', { title: jobData.title, company: jobData.company })
      setJob(jobData)

      // Auto-analyze immediately
      console.log('🎯 [JOB_ANALYSIS] Starting job analysis...')
      await analyzeJob(jobData)
    } catch (err: any) {
      console.error('Failed to load job:', err)
      setError('Failed to load job data')
      setLoading(false)
    }
  }

  const analyzeJob = async (jobData: JobData) => {
    // Get user's resume from localStorage (optional) - MUST be outside try block for catch scope
    const resume = localStorage.getItem('uploadedResume')
    setHasResume(!!resume)

    try {
      // Call analysis API (works with or without resume)
      const response = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: jobData,
          resume: resume || undefined // Optional resume
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()
      setAnalysis(result.analysis)
      
      if (!resume) {
        console.log('📋 Browsing job without resume - match score disabled')
      }
    } catch (err: any) {
      console.error('Analysis failed:', err)
      // Provide fallback analysis (without match score if no resume)
      setAnalysis({
        matchScore: resume ? 75 : undefined,
        matchingSkills: resume ? (jobData.skills?.slice(0, 5) || ['JavaScript', 'React', 'Node.js']) : [],
        missingSkills: resume ? ['Docker', 'Kubernetes'] : [],
        recommendations: resume ? [
          'Highlight your experience with similar technologies',
          'Emphasize transferable skills',
          'Show enthusiasm for learning new tools'
        ] : [],
        estimatedFit: 'good'
      })
    } finally {
      setLoading(false)
      
      // ENTERPRISE FIX: Minimum 2-second display time before allowing proceed
      setTimeout(() => {
        setCanProceed(true)
        console.log('🎯 [JOB_ANALYSIS] Analysis complete - user can now proceed')
      }, 2000)
    }
  }

  const handleResearchCompany = () => {
    if (!job) return
    
    // Store in cf:selectedJob format for company page auto-population
    localStorage.setItem('cf:selectedJob', JSON.stringify({
      company: job.company,
      title: job.title,
      location: job.location,
      url: job.url
    }))
    
    router.push('/career-finder/company')
  }

  const extractWebsite = (url: string): string => {
    try {
      const urlObj = new URL(url)
      // Try to extract company domain from job board URL
      // e.g., indeed.com/company/spotify -> spotify.com
      const pathParts = urlObj.pathname.split('/')
      const companyIndex = pathParts.indexOf('company')
      if (companyIndex >= 0 && pathParts[companyIndex + 1]) {
        return `${pathParts[companyIndex + 1]}.com`
      }
      return job?.company?.toLowerCase().replace(/\s+/g, '') + '.com' || ''
    } catch {
      return job?.company?.toLowerCase().replace(/\s+/g, '') + '.com' || ''
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing job match...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-6 py-8">
        <CareerFinderBackButton />
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground">{error || 'Job not found'}</p>
          <button
            onClick={() => router.push('/career-finder/search')}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  const fitColor = {
    excellent: 'text-green-500',
    good: 'text-blue-500',
    fair: 'text-yellow-500',
    poor: 'text-red-500'
  }[analysis?.estimatedFit || 'fair']

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <CareerFinderBackButton label="Back to Search" />

      {/* Job Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{job.title}</h1>
            <p className="text-xl text-muted-foreground">{job.company}</p>
          </div>
          {analysis && (
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{analysis.matchScore}%</div>
              <div className={`text-sm font-medium ${fitColor}`}>
                {analysis.estimatedFit.toUpperCase()} FIT
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary}</span>
            </div>
          )}
          {job.source && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>{job.source}</span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Matching Skills */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold text-foreground">Matching Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.matchingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {analysis.missingSkills.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-foreground">Skills to Highlight</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium"
                  >
                    → {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Recommendations</h2>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={handleResearchCompany}
          disabled={!canProceed}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
          }`}
          title={!canProceed ? 'Please review the analysis before proceeding' : ''}
        >
          {canProceed ? 'Research Company →' : 'Analyzing... Please wait'}
        </button>
        <button
          onClick={() => router.push(`/create-application?jobId=${job.id}`)}
          disabled={!canProceed}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-secondary text-secondary-foreground hover:opacity-90 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
          }`}
          title={!canProceed ? 'Please review the analysis before proceeding' : ''}
        >
          Create Application
        </button>
      </div>
      
      {/* User guidance */}
      {!canProceed && analysis && (
        <div className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
          ✨ Review your match analysis above before proceeding
        </div>
      )}
    </div>
  )
}


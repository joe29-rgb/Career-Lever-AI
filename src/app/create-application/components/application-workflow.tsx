'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Search,
  Building,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { ResumeUpload } from '@/components/resume-upload'
import { JobAnalysisForm } from '@/components/job-analysis'
import { CompanyResearchPanel } from '@/components/company-research'
import { ResumeCustomizer } from '@/components/resume-customizer'
import { Resume, JobAnalysis, CompanyData } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useResumeContext } from '@/components/resume-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STEPS = [
  {
    id: 'upload',
    title: 'Upload Resume',
    description: 'Upload your resume for AI analysis',
    icon: Upload,
    component: 'resume-upload'
  },
  {
    id: 'analyze',
    title: 'Analyze Job',
    description: 'Paste job description for AI analysis',
    icon: Search,
    component: 'job-analysis'
  },
  {
    id: 'research',
    title: 'Research Company',
    description: 'Gather company insights',
    icon: Building,
    component: 'company-research'
  },
  {
    id: 'customize',
    title: 'Customize Resume',
    description: 'Tailor your resume with AI',
    icon: FileText,
    component: 'resume-customizer'
  }
]

interface ApplicationWorkflowProps {
  userId: string
}

export function ApplicationWorkflow({ userId }: ApplicationWorkflowProps) {
  const searchParams = useSearchParams()
  const initialStepFromQuery = useMemo(() => {
    const step = (searchParams?.get('step') || '').toLowerCase()
    switch (step) {
      case 'upload': return 0
      case 'analyze': return 1
      case 'research': return 2
      case 'customize': return 3
      default: return 0
    }
  }, [searchParams])
  const [currentStep, setCurrentStep] = useState(initialStepFromQuery)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [workflowData, setWorkflowData] = useState<{
    resume?: Resume
    jobAnalysis?: { analysis: JobAnalysis; keywords: string[] }
    companyData?: CompanyData
    customizedResume?: any
  }>({})
  const router = useRouter()

  const handleStepComplete = (stepIndex: number, data: any) => {
    const newCompletedSteps = new Set(completedSteps)
    newCompletedSteps.add(stepIndex)
    setCompletedSteps(newCompletedSteps)

    setWorkflowData(prev => ({
      ...prev,
      ...data
    }))
    // Do not auto-advance; keep results visible for user
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      // Here you could save the complete application to the database
      toast.success('Application created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to save application')
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <ExistingResumeOrUpload onComplete={(resume)=>handleStepComplete(0,{ resume })} />
            <JobFinderQuick onSelect={(job) => {
              // Pre-fill Analyze Job with scraped description
              try {
                localStorage.setItem('job:description', job.description || '')
                if (job.title) localStorage.setItem('job:title', job.title)
                if (job.companyName) localStorage.setItem('job:company', job.companyName)
              } catch {}
              setCurrentStep(1)
              toast.success('Loaded job into Analyze step')
            }} />
          </div>
        )

      case 1:
        return (
          <JobAnalysisForm
            onAnalysisComplete={(analysis) => {
              handleStepComplete(1, { jobAnalysis: analysis })
            }}
            onError={(error) => {
              toast.error(error)
            }}
          />
        )

      case 2:
        return (
          <CompanyResearchPanel
            companyName={workflowData.jobAnalysis?.analysis.companyName}
            onResearchComplete={(companyData) => {
              handleStepComplete(2, { companyData })
            }}
            onError={(error) => {
              toast.error(error)
            }}
          />
        )

      case 3:
        return workflowData.resume && workflowData.jobAnalysis ? (
          <ResumeCustomizer
            resume={workflowData.resume}
            jobAnalysis={workflowData.jobAnalysis}
            onCustomizationComplete={(customizedResume) => {
              handleStepComplete(3, { customizedResume })
            }}
            onError={(error) => {
              toast.error(error)
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Please complete the previous steps first.</p>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const isStepAccessible = (stepIndex: number) => {
    // Allow users to jump to any step (job analysis/company research without resume)
    return true
  }

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.has(stepIndex)
  }

  const canProceedToNext = () => {
    return completedSteps.has(currentStep)
  }

  const overallProgress = (completedSteps.size / STEPS.length) * 100

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application Progress</CardTitle>
              <CardDescription>
                Complete each step to create your tailored job application
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {completedSteps.size} of {STEPS.length} steps completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={overallProgress} className="w-full" />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = isStepCompleted(index)
              const isCurrent = index === currentStep
              const isAccessible = isStepAccessible(index)

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(index)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : isAccessible
                        ? 'hover:bg-gray-100 text-gray-600'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`p-2 rounded-full mb-2 ${
                      isCurrent
                        ? 'bg-blue-200'
                        : isCompleted
                        ? 'bg-green-200'
                        : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{step.title}</div>
                      <div className="text-xs opacity-75 hidden sm:block">{step.description}</div>
                    </div>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep].icon, { className: "h-5 w-5" })}
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep].description}
            </CardDescription>
          </CardHeader>
        </Card>

        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep === STEPS.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={!completedSteps.has(STEPS.length - 1)}
                  size="lg"
                >
                  Complete Application
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Panel */}
      {completedSteps.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
            <CardDescription>
              Overview of your completed work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowData.resume && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Resume Uploaded</div>
                    <div className="text-xs text-gray-600">{workflowData.resume.originalFileName}</div>
                  </div>
                </div>
              )}

              {workflowData.jobAnalysis && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Job Analyzed</div>
                    <div className="text-xs text-gray-600">{workflowData.jobAnalysis.analysis.jobTitle}</div>
                  </div>
                </div>
              )}

              {workflowData.companyData && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">Company Researched</div>
                    <div className="text-xs text-gray-600">{workflowData.companyData.companyName}</div>
                  </div>
                </div>
              )}

              {workflowData.customizedResume && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium">Resume Customized</div>
                    <div className="text-xs text-gray-600">{workflowData.customizedResume.matchScore}% match</div>
                  </div>
                </div>
              )}
            </div>

            {/* Rich details */}
            {workflowData.jobAnalysis && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-2">Job Details</div>
                <div className="text-xs text-gray-700">{workflowData.jobAnalysis.analysis.companyName} — {workflowData.jobAnalysis.analysis.jobTitle}</div>
                <div className="mt-2 text-xs text-gray-600">Key Requirements: {workflowData.jobAnalysis.analysis.keyRequirements.join(', ')}</div>
                <div className="mt-1 text-xs text-gray-600">Preferred Skills: {workflowData.jobAnalysis.analysis.preferredSkills.join(', ')}</div>
              </div>
            )}

            {workflowData.companyData && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="text-sm font-semibold mb-2">Company Insights</div>
                <div className="text-xs text-gray-700">Industry: {workflowData.companyData.industry || 'N/A'}</div>
                <div className="mt-1 text-xs text-gray-600">Culture: {(workflowData.companyData.culture || []).join(', ')}</div>
                {workflowData.companyData.recentNews && workflowData.companyData.recentNews.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">Recent News: {workflowData.companyData.recentNews.slice(0,3).map((n:any)=>n.title).join(' • ')}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ExistingResumeOrUpload({ onComplete }: { onComplete: (resume: Resume) => void }) {
  const { resumes, selectedResumeId, setSelectedResumeId, refresh } = useResumeContext()
  const [saving, setSaving] = useState(false)
  useEffect(() => { refresh() }, [])
  const current = resumes.find(r => r._id === selectedResumeId) || resumes[0]
  return (
    <div className="space-y-4">
      {resumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Existing Resume</CardTitle>
            <CardDescription>Use a previously uploaded resume or upload a new one below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={current?._id} onValueChange={(v)=>setSelectedResumeId(v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a resume" /></SelectTrigger>
              <SelectContent>
                {resumes.map(r => (
                  <SelectItem key={r._id} value={r._id!}>{r.originalFileName} — {new Date(r.createdAt||'').toLocaleDateString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!current || saving} onClick={() => { if (current) onComplete(current as any) }}>Use Selected Resume</Button>
          </CardContent>
        </Card>
      )}
      <ResumeUpload
        onUploadSuccess={(resume) => {
          onComplete(resume)
        }}
        onUploadError={(error) => {
          toast.error(error)
        }}
      />
    </div>
  )
}

function JobFinderQuick({ onSelect }: { onSelect: (job: { title?: string; companyName?: string; description?: string }) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ title?: string; companyName?: string; jobUrl: string; source: string; description?: string }>>([])
  const [ranked, setRanked] = useState<Array<{ url: string; title?: string; companyName?: string; score: number; reasons: string[] }>>([])
  const runSuggest = async () => {
    setLoading(true); setError(null); setResults([]); setRanked([])
    try {
      const resp = await fetch('/api/v2/jobs/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const reqId = resp.headers.get('x-request-id') || ''
      const json = await resp.json().catch(()=>({}))
      if (!resp.ok || !json.success) {
        if (resp.status === 401) { toast.error('Please sign in to find jobs' + (reqId ? ` (Ref: ${reqId})` : '')); return }
        if (resp.status === 429) { toast.error((json.error || 'Rate limit exceeded') + (reqId ? ` (Ref: ${reqId})` : '')); return }
        if (resp.status >= 500) { toast.error('Server error while finding jobs' + (reqId ? ` (Ref: ${reqId})` : '')); return }
        throw new Error(json.error || 'Failed to find jobs')
      }
      // Enhance by scraping first few details
      const enriched: typeof results = []
      for (const r of (json.results || []).slice(0,6)) {
        try {
          const det = await fetch('/api/jobs/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl: r.url }) })
          const dj = await det.json().catch(()=>({}))
          if (det.ok && dj) {
            enriched.push({ title: dj.title || r.title, companyName: dj.companyName, description: dj.description, jobUrl: r.url, source: r.source })
          } else {
            enriched.push({ title: r.title, companyName: undefined, description: undefined, jobUrl: r.url, source: r.source })
          }
        } catch {
          enriched.push({ title: r.title, companyName: undefined, description: undefined, jobUrl: r.url, source: r.source })
        }
      }
      setResults(enriched)
      // Rank suggestions against latest resume
      try {
        const rankPayload = enriched.map(e => ({ url: e.jobUrl, title: e.title, companyName: e.companyName, description: e.description }))
        const rankResp = await fetch('/api/v2/jobs/rank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobs: rankPayload }) })
        const rReqId = rankResp.headers.get('x-request-id') || ''
        const rj = await rankResp.json().catch(()=>({}))
        if (rankResp.ok && rj.success) setRanked(rj.rankings || [])
        else if (!rankResp.ok) {
          if (rankResp.status === 429) toast.error((rj.error || 'Rate limit exceeded') + (rReqId ? ` (Ref: ${rReqId})` : ''))
        }
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to find jobs')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Optional: Find a Job from Your Resume</CardTitle>
        <CardDescription>We’ll search public job boards using your resume’s keywords. Select one to load into Analyze.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={runSuggest} disabled={loading} className="w-full">{loading ? 'Searching…' : 'Find Jobs Near Me'}</Button>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {results.map((r,i)=> (
              <button key={i} onClick={()=> onSelect({ title: r.title, companyName: r.companyName, description: r.description })} className="text-left border rounded p-2 hover:shadow">
                <div className="text-xs text-gray-500 mb-1">{r.source}</div>
                <div className="font-medium line-clamp-1">{r.title || r.jobUrl}</div>
                {r.companyName && <div className="text-xs text-gray-600">{r.companyName}</div>}
                {r.description && <div className="text-xs text-gray-600 line-clamp-2 mt-1">{r.description}</div>}
                {ranked.length > 0 && (
                  <div className="mt-2 text-[11px] text-gray-700">
                    {(() => { const s = ranked.find(x=>x.url === r.jobUrl); return s ? (
                      <div>
                        <div className="font-medium">Fit Score: {s.score}%</div>
                        {s.reasons && s.reasons.length > 0 && (
                          <ul className="list-disc ml-4 mt-1">
                            {s.reasons.slice(0,2).map((rs,idx)=>(<li key={idx}>{rs}</li>))}
                          </ul>
                        )}
                      </div>
                    ) : null })()}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

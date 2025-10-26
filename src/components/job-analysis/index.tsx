'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Briefcase,
  Building,
  Target,
  Users,
  Award,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { JobAnalysis } from '@/types'
import toast from 'react-hot-toast'

interface JobAnalysisFormProps {
  onAnalysisComplete: (analysis: { analysis: JobAnalysis; keywords: string[] }) => void
  onError: (error: string) => void
}

export function JobAnalysisForm({ onAnalysisComplete, onError }: JobAnalysisFormProps) {
  const [jobDescription, setJobDescription] = useState<string>(()=>{
    try { return localStorage.getItem('job:description') || '' } catch { return '' }
  })
  const [jobTitle, setJobTitle] = useState<string>(()=>{
    try { return localStorage.getItem('job:title') || '' } catch { return '' }
  })
  const [companyName, setCompanyName] = useState<string>(()=>{
    try { return localStorage.getItem('job:company') || '' } catch { return '' }
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{ analysis: JobAnalysis; keywords: string[] } | null>(null)
  const [compare, setCompare] = useState<{ score: number; matched: string[]; missing: string[]; suggestions?: string[] } | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [psychology, setPsychology] = useState<any | null>(null)
  const [competition, setCompetition] = useState<any | null>(null)
  const [painpoints, setPainpoints] = useState<any | null>(null)
  const [success, setSuccess] = useState<{ score:number; reasons:string[]; riskFactors:string[]; improvements:string[] } | null>(null)
  const [timing, setTiming] = useState<{ score:number; bestWindows:Array<{window:string;reason:string}>; notes:string[] } | null>(null)

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 15, 90))
      }, 500)

      const response = await fetch('/api/job/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          jobTitle: jobTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
        }),
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      const result = {
        analysis: data.analysis,
        keywords: data.keywords
      }

      setAnalysisResult(result)
      try {
        localStorage.setItem('job:description', jobDescription)
        if (jobTitle) localStorage.setItem('job:title', jobTitle)
        if (companyName) localStorage.setItem('job:company', companyName)
      } catch {}
      onAnalysisComplete(result)

      // Fetch psychology, competition, pain points, and success probability in parallel
      try {
        // Try to load resume text for success scoring
        let resumeText: string | undefined
        try {
          const rl = await fetch('/api/resume/list')
          if (rl.ok) { const rj = await rl.json(); resumeText = rj.resumes?.[0]?.extractedText }
        } catch {}

        const [psyRes, compRes, painRes, sucRes, timRes] = await Promise.all([
          fetch('/api/insights/psychology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription }) }),
          fetch('/api/insights/competition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription, jobUrl: importUrl || undefined }) }),
          fetch('/api/insights/painpoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobTitle: jobTitle || result.analysis.jobTitle, jobDescription }) }),
          resumeText ? fetch('/api/insights/success', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription, resumeText }) }) : Promise.resolve({ ok: false }) as any,
          fetch('/api/insights/timing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobTitle: jobTitle || result.analysis.jobTitle, companyName: companyName || result.analysis.companyName, location: companyName ? undefined : '', urgency: competition?.urgency, applicants: competition?.applicantsEstimate }) })
        ])
        if (psyRes.ok) { const pj = await psyRes.json(); setPsychology(pj.psychology || null); try { localStorage.setItem('analyze:psychology', JSON.stringify(pj.psychology || {})) } catch {} }
        if (compRes.ok) { const cj = await compRes.json(); setCompetition(cj.competition || null) }
        if (painRes.ok) { const pj2 = await painRes.json(); setPainpoints(pj2.painpoints || null) }
        if ((sucRes as any).ok) { const sj = await (sucRes as Response).json(); setSuccess(sj.successScore || null) }
        if (timRes.ok) { const tj = await timRes.json(); setTiming(tj.timing || null) }
      } catch {}

      toast.success('Job analysis completed successfully!')

    } catch (error) {
      console.error('Analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      setError(errorMessage)
      onError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setAnalysisProgress(0), 1000)
    }
  }

  const runComparison = async () => {
    try {
      if (!analysisResult) return
      // Try to load latest resume id
      let resumeId: string | undefined
      let resumeText: string | undefined
      try {
        const rl = await fetch('/api/resume/list')
        if (rl.ok) {
          const rj = await rl.json()
          resumeId = rj.resumes?.[0]?._id
          resumeText = rj.resumes?.[0]?.extractedText
        }
      } catch {}
      if (!resumeId && !resumeText) {
        toast.error('No resume found. Upload a resume first (Quick Actions or Resume Builder).')
        return
      }

      const resp = await fetch('/api/job/compare', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAnalysis: analysisResult, resumeId, resumeText })
      })
      if (!resp.ok) throw new Error('Compare failed')
      const json = await resp.json()
      setCompare({ score: json.score, matched: json.matchedKeywords || [], missing: json.missingKeywords || [], suggestions: json.suggestions || [] })
    } catch (e) {
      toast.error('Comparison failed. Upload or select a resume and try again.')
      setCompare(null)
    }
  }

  const resetForm = () => {
    setJobDescription('')
    setJobTitle('')
    setCompanyName('')
    setAnalysisResult(null)
    setError(null)
    setAnalysisProgress(0)
  }

  const importJob = async () => {
    if (!importUrl || !/^https?:\/\//i.test(importUrl)) {
      toast.error('Enter a valid job URL')
      return
    }
    setIsImporting(true)
    try {
      const base = typeof window !== 'undefined' ? '' : (process.env.NEXTAUTH_URL || 'http://localhost:3000')
      const resp = await fetch(`${base}/api/jobs/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl: importUrl }) })
      const json = await resp.json()
      if (!resp.ok || !json.success) throw new Error(json.error || 'Import failed')
      // We cannot fetch full application easily here; prompt user to Analyze with scraped description
      toast.success('Imported job. Paste its description to analyze or proceed if prefilled.')
    } catch (e) {
      toast.error('Failed to import job')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Job Analysis
        </CardTitle>
        <CardDescription>
          Paste a job description to get AI-powered analysis of requirements, skills, and company insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Import by URL */}
        <div className="space-y-2">
          <Label htmlFor="importUrl">Import Job by URL (optional)</Label>
          <div className="flex gap-2">
            <Input id="importUrl" placeholder="https://..." value={importUrl} onChange={(e)=>setImportUrl(e.target.value)} disabled={isAnalyzing || isImporting} />
            <Button variant="outline" onClick={importJob} disabled={isAnalyzing || isImporting}>
              {isImporting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Importing...</>) : 'Import'}
            </Button>
          </div>
        </div>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title (Optional)</Label>
            <Input
              id="jobTitle"
              placeholder="e.g., Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name (Optional)</Label>
            <Input
              id="companyName"
              placeholder="e.g., Google"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description *</Label>
          <Textarea
            id="jobDescription"
            placeholder="Paste the complete job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            disabled={isAnalyzing}
            className="resize-none"
          />
          <div className="text-sm text-gray-500">
            {jobDescription.length} characters (minimum 50 required)
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Analyzing job description...</span>
              <span className="text-sm text-gray-600">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="w-full" />
            {/* Skeletons while loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-28 md:col-span-2" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !jobDescription.trim() || jobDescription.length < 50}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Job
              </>
            )}
          </Button>
          {(analysisResult || error) && (
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          )}
          {analysisResult && (
            <Button
              variant="outline"
              onClick={runComparison}
              disabled={isAnalyzing}
              title="Compare analyzed job against your latest resume"
            >
              Compare with Resume
            </Button>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Analysis completed successfully!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm text-gray-600">{analysisResult.analysis.jobTitle}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Company</Label>
                    <p className="text-sm text-gray-600">{analysisResult.analysis.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Experience Level</Label>
                    <p className="text-sm text-gray-600">{analysisResult.analysis.experienceLevel}</p>
                  </div>
                  {analysisResult.analysis.salaryRange && (
                    <div>
                      <Label className="text-sm font-medium">Salary Range</Label>
                      <p className="text-sm text-gray-600">{analysisResult.analysis.salaryRange}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Key Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.analysis.keyRequirements.map((req, index) => (
                      <Badge key={index} variant="secondary">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Preferred Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.analysis.preferredSkills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Company Culture */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Company Culture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.analysis.companyCulture.map((culture, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{culture}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Keywords */}
            <Card>
              <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Keywords Found
                </CardTitle>
                <CardDescription>
                  Important keywords to include in your resume and cover letter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                {compare?.suggestions && compare.suggestions.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">What to fix</div>
                    <ul className="list-disc ml-5 text-sm text-gray-700">
                      {compare.suggestions.slice(0,4).map((s, i)=>(<li key={i}>{s}</li>))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {analysisResult.analysis.responsibilities.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Key Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.analysis.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isAnalyzing && !analysisResult && !error && (
          <div className="text-sm text-gray-600 border rounded-lg p-4">
            Paste a full job description and click Analyze to see requirements, skills, and company insights.
          </div>
        )}

        {compare && (
          <div className="space-y-3 mt-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Match Score</span>
              <span className="text-sm">{compare.score}%</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold mb-1">Matched Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {compare.matched.slice(0, 20).map((kw, i) => (
                    <Badge key={i} variant="secondary">{kw}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1">Missing Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {compare.missing.slice(0, 20).map((kw, i) => (
                    <Badge key={i} variant="outline">{kw}</Badge>
                  ))}
                </div>
              </div>
            </div>
            {compare.suggestions && compare.suggestions.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold mb-1">What to fix</div>
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  {compare.suggestions.map((s, i)=>(<li key={i}>{s}</li>))}
                </ul>
              </div>
            )}
          </div>
        )}

        {(psychology || competition || painpoints || success) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {psychology && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Psychology & Tone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div><span className="font-medium">Tone:</span> {psychology.tone} (formality {psychology.formality})</div>
                  {Array.isArray(psychology.values) && psychology.values.length > 0 && (
                    <div>
                      <div className="font-medium">Values</div>
                      <div className="flex flex-wrap gap-2 mt-1">{psychology.values.map((v:string,i:number)=>(<Badge key={i} variant="outline">{v}</Badge>))}</div>
                    </div>
                  )}
                  {Array.isArray(psychology.languageGuidance) && psychology.languageGuidance.length > 0 && (
                    <div>
                      <div className="font-medium">Language Guidance</div>
                      <ul className="list-disc ml-5 mt-1">{psychology.languageGuidance.map((g:string,i:number)=>(<li key={i}>{g}</li>))}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {competition && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Competition & Urgency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div><span className="font-medium">Applicants (est):</span> {competition.applicantsEstimate} ({competition.competitionBand})</div>
                  <div><span className="font-medium">Urgency:</span> {competition.urgency}/100</div>
                  {Array.isArray(competition.differentiation) && competition.differentiation.length > 0 && (
                    <div>
                      <div className="font-medium">Differentiation</div>
                      <ul className="list-disc ml-5 mt-1">{competition.differentiation.slice(0,4).map((d:string,i:number)=>(<li key={i}>{d}</li>))}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {painpoints && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pain Points & Angles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  {Array.isArray(painpoints.companyPainPoints) && painpoints.companyPainPoints.length > 0 && (
                    <div>
                      <div className="font-medium">Company Pain Points</div>
                      <ul className="list-disc ml-5 mt-1">{painpoints.companyPainPoints.slice(0,6).map((p:string,i:number)=>(<li key={i}>{p}</li>))}</ul>
                    </div>
                  )}
                  {Array.isArray(painpoints.rolePainPoints) && painpoints.rolePainPoints.length > 0 && (
                    <div>
                      <div className="font-medium">Role Pain Points</div>
                      <ul className="list-disc ml-5 mt-1">{painpoints.rolePainPoints.slice(0,6).map((p:string,i:number)=>(<li key={i}>{p}</li>))}</ul>
                    </div>
                  )}
                  {Array.isArray(painpoints.solutionAngles) && painpoints.solutionAngles.length > 0 && (
                    <div>
                      <div className="font-medium">Solution Angles</div>
                      <ul className="list-disc ml-5 mt-1">{painpoints.solutionAngles.slice(0,6).map((p:string,i:number)=>(<li key={i}>{p}</li>))}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {success && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Predicted Success Probability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Score</span>
                    <span>{success.score}/100</span>
                  </div>
                  {Array.isArray(success.reasons) && success.reasons.length > 0 && (
                    <div>
                      <div className="font-medium">Reasons</div>
                      <ul className="list-disc ml-5 mt-1">{success.reasons.slice(0,4).map((r:string,i:number)=>(<li key={i}>{r}</li>))}</ul>
                    </div>
                  )}
                  {Array.isArray(success.improvements) && success.improvements.length > 0 && (
                    <div>
                      <div className="font-medium">Improvements</div>
                      <ul className="list-disc ml-5 mt-1">{success.improvements.slice(0,4).map((r:string,i:number)=>(<li key={i}>{r}</li>))}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {timing && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Optimal Timing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Timing Score</span>
                    <span>{timing.score}/100</span>
                  </div>
                  {Array.isArray(timing.bestWindows) && timing.bestWindows.length > 0 && (
                    <div>
                      <div className="font-medium">Best Windows</div>
                      <ul className="list-disc ml-5 mt-1">
                        {timing.bestWindows.slice(0,3).map((w,i)=>(<li key={i}>{w.window} — {w.reason}</li>))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(timing.notes) && timing.notes.length > 0 && (
                    <div>
                      <div className="font-medium">Notes</div>
                      <ul className="list-disc ml-5 mt-1">
                        {timing.notes.slice(0,3).map((n,i)=>(<li key={i}>{n}</li>))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}




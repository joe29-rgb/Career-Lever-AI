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
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{ analysis: JobAnalysis; keywords: string[] } | null>(null)
  const [compare, setCompare] = useState<{ score: number; matched: string[]; missing: string[] } | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [psychology, setPsychology] = useState<any | null>(null)
  const [competition, setCompetition] = useState<any | null>(null)

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
      onAnalysisComplete(result)

      // Fetch psychology and competition insights in parallel
      try {
        const [psyRes, compRes] = await Promise.all([
          fetch('/api/insights/psychology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription }) }),
          fetch('/api/insights/competition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription, jobUrl: importUrl || undefined }) })
        ])
        if (psyRes.ok) { const pj = await psyRes.json(); setPsychology(pj.psychology || null) }
        if (compRes.ok) { const cj = await compRes.json(); setCompetition(cj.competition || null) }
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
      try {
        const rl = await fetch('/api/resume/list')
        if (rl.ok) {
          const rj = await rl.json()
          resumeId = rj.resumes?.[0]?._id
        }
      } catch {}

      const resp = await fetch('/api/job/compare', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAnalysis: analysisResult, resumeId })
      })
      if (!resp.ok) throw new Error('Compare failed')
      const json = await resp.json()
      setCompare({ score: json.score, matched: json.matchedKeywords || [], missing: json.missingKeywords || [] })
    } catch (e) {
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
      const resp = await fetch('/api/jobs/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl: importUrl }) })
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
            <Button variant="outline" onClick={runComparison} disabled={isAnalyzing}>
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
          </div>
        )}

        {(psychology || competition) && (
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}




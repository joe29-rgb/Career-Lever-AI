'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Wand2,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Target,
  Lightbulb,
  TrendingUp
} from 'lucide-react'
import { Resume, JobAnalysis } from '@/types'
import toast from 'react-hot-toast'

interface ResumeCustomizerProps {
  resume: Resume
  jobAnalysis: { analysis: JobAnalysis; keywords: string[] }
  onCustomizationComplete: (customizedResume: any) => void
  onError: (error: string) => void
}

export function ResumeCustomizer({
  resume,
  jobAnalysis,
  onCustomizationComplete,
  onError
}: ResumeCustomizerProps) {
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizationProgress, setCustomizationProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [customizedResult, setCustomizedResult] = useState<any>(null)
  const [diffHtml, setDiffHtml] = useState<string>('')
  const [ats, setAts] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('preview')
  const [authenticity, setAuthenticity] = useState<{ score: number; suggestions: string[] } | null>(null)
  const [tone, setTone] = useState<'professional'|'enthusiastic'|'concise'>('professional')
  const [autoTone, setAutoTone] = useState<boolean>(false)
  const [overrideText, setOverrideText] = useState<string>('')

  const handleCustomize = async () => {
    setIsCustomizing(true)
    setCustomizationProgress(0)
    setError(null)

    try {
      if (autoTone) {
        try {
          const stored = localStorage.getItem('analyze:psychology')
          if (stored) {
            const pj = JSON.parse(stored)
            if (pj?.tone) {
              const normalized = String(pj.tone).toLowerCase()
              if (normalized.includes('enthusias')) setTone('enthusiastic')
              else if (normalized.includes('concise') || normalized.includes('direct')) setTone('concise')
              else setTone('professional')
            }
          }
        } catch {}
      }
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCustomizationProgress(prev => Math.min(prev + 20, 90))
      }, 300)

      // Prepare psychology/companyData if available
      let psychology: any | undefined
      try { const stored = localStorage.getItem('analyze:psychology'); if (stored) psychology = JSON.parse(stored) } catch {}
      const response = await fetch('/api/resume/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume._id,
          jobDescription: `Title: ${jobAnalysis.analysis.jobTitle}\nCompany: ${jobAnalysis.analysis.companyName}\n\nRequirements: ${jobAnalysis.analysis.keyRequirements.join(', ')}\nSkills: ${jobAnalysis.analysis.preferredSkills.join(', ')}\nResponsibilities: ${jobAnalysis.analysis.responsibilities.join(', ')}\nCulture: ${jobAnalysis.analysis.companyCulture.join(', ')}`,
          jobTitle: jobAnalysis.analysis.jobTitle,
          companyName: jobAnalysis.analysis.companyName,
          tone,
          overrideResumeText: overrideText && overrideText.length > 50 ? overrideText : undefined,
          psychology
        }),
      })

      clearInterval(progressInterval)
      setCustomizationProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Customization failed')
      }

      const data = await response.json()
      setCustomizedResult(data)
      onCustomizationComplete(data.customizedResume)
      // Compute diff (simple client-side highlighting)
      try {
        const beforeText = (data.originalResumeText || resume.extractedText || '') as string
        const afterText = data.customizedResume.customizedText as string
        const beforeTokens = beforeText.split(/\s+/)
        const afterTokens = afterText.split(/\s+/)
        const pieces: string[] = []
        let ai = 0
        let bi = 0
        while (ai < afterTokens.length && bi < beforeTokens.length) {
          if (afterTokens[ai] === beforeTokens[bi]) {
            pieces.push(afterTokens[ai])
            ai++; bi++
          } else {
            const start = ai
            let window = 0
            while (ai < afterTokens.length && window < 20 && afterTokens[ai] !== beforeTokens[bi]) { ai++; window++ }
            const added = afterTokens.slice(start, ai).join(' ')
            if (added) pieces.push(`<mark class=\"bg-yellow-200\">${added}</mark>`) 
          }
        }
        if (ai < afterTokens.length) {
          pieces.push(`<mark class=\"bg-yellow-200\">${afterTokens.slice(ai).join(' ')}</mark>`)
        }
        setDiffHtml(pieces.join(' '))
      } catch {}

      // ATS score
      try {
        const resp = await fetch('/api/insights/ats/score', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: data.customizedResume.customizedText, jobAnalysis })
        })
        if (resp.ok) { const j = await resp.json(); setAts(j.ats) }
      } catch {}

      // Authenticity scoring
      try {
        const ar = await fetch('/api/insights/authenticity', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalText: resume.extractedText, generatedText: data.customizedResume.customizedText })
        })
        if (ar.ok) { const aj = await ar.json(); setAuthenticity(aj.authenticity) }
      } catch {}

      toast.success('Resume customized successfully!')

    } catch (error) {
      console.error('Customization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Customization failed'
      setError(errorMessage)
      onError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCustomizing(false)
      setTimeout(() => setCustomizationProgress(0), 1000)
    }
  }

  const downloadResume = () => {
    if (!customizedResult) return

    // Create a simple text file for download
    const blob = new Blob([customizedResult.customizedResume.customizedText], {
      type: 'text/plain'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customized-resume-${jobAnalysis.analysis.companyName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Resume downloaded!')
  }

  return (
    <div className="space-y-6">
      {/* Customization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Resume Customization
          </CardTitle>
          <CardDescription>
            AI-powered resume tailoring based on job requirements and company insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Tone guidance</p>
              <Select value={tone} onValueChange={(v)=>setTone(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select tone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">Auto-tone from Psychology</p>
              <button type="button" onClick={()=>setAutoTone(v=>!v)} className={`px-3 py-2 border rounded text-sm ${autoTone ? 'bg-green-50 border-green-200' : 'bg-white'}`}>{autoTone ? 'Enabled' : 'Disabled'}</button>
              {autoTone && (
                <p className="text-xs text-gray-500">We’ll use the Analyze page’s tone if available</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Optional: Override Resume Text</p>
            <Textarea rows={6} placeholder="Paste clean resume text to override extraction (optional)" value={overrideText} onChange={(e)=>setOverrideText(e.target.value)} />
            <p className="text-xs text-gray-500">Use this if the PDF text extraction contained gibberish. Minimum 50 characters.</p>
          </div>
          {/* Job Match Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Target Job</p>
                  <p className="text-lg font-semibold">{jobAnalysis.analysis.jobTitle}</p>
                  <p className="text-sm text-gray-600">{jobAnalysis.analysis.companyName}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Keywords Found</p>
                  <p className="text-lg font-semibold">{jobAnalysis.keywords.length}</p>
                  <p className="text-sm text-gray-600">relevant terms</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Experience Level</p>
                  <p className="text-lg font-semibold">{jobAnalysis.analysis.experienceLevel}</p>
                  <p className="text-sm text-gray-600">required</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isCustomizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customizing resume...</span>
                <span className="text-sm text-gray-600">{customizationProgress}%</span>
              </div>
              <Progress value={customizationProgress} className="w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-40 md:col-span-2" />
              </div>
            </div>
          )}

          {/* Action Button */}
          {!customizedResult && (
            <Button
              onClick={handleCustomize}
              disabled={isCustomizing}
              size="lg"
              className="w-full"
            >
              {isCustomizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Customizing Resume...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Customize Resume with AI
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {customizedResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Customization Complete
                </CardTitle>
                <CardDescription>
                  Your resume has been optimized for the {jobAnalysis.analysis.jobTitle} position at {jobAnalysis.analysis.companyName}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadResume}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Customized Resume</h4>
                    <Badge variant="secondary">
                      {customizedResult.matchScore}% Match Score
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto border rounded p-4 bg-white">
                    {customizedResult.customizedResume.customizedText}
                  </div>
                  {authenticity && (
                    <div className="mt-3 text-sm text-gray-700">
                      <div className="font-medium">Authenticity Score: {authenticity.score}/100</div>
                      {authenticity.suggestions.length > 0 && (
                        <ul className="list-disc ml-5 mt-1">
                          {authenticity.suggestions.slice(0,3).map((s, i)=>(<li key={i}>{s}</li>))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Changes Highlighted</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto border rounded p-4 bg-white" dangerouslySetInnerHTML={{ __html: diffHtml || customizedResult.customizedResume.customizedText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }} />
                  <div className="text-xs text-gray-500 mt-2">New or significantly changed text is highlighted.</div>
                </div>

                {ats && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">ATS Optimization</h4>
                      <Badge variant="secondary">{ats.score}/100</Badge>
                    </div>
                    <div className="text-xs text-gray-700">Missing keywords:</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {ats.missingKeywords.slice(0, 20).map((k: string, i: number) => (
                        <Badge key={i} variant="outline">{k}</Badge>
                      ))}
                    </div>
                    {ats.suggestions?.length > 0 && (
                      <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                        {ats.suggestions.map((s: string, i: number) => (<li key={i}>{s}</li>))}
                      </ul>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="improvements" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Applied Improvements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customizedResult.improvements.map((improvement: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-800">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Additional Suggestions</h4>
                  <div className="space-y-3">
                    {customizedResult.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {customizedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Before vs After Comparison
            </CardTitle>
            <CardDescription>
              See how your resume has been optimized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Original Resume
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border rounded p-3 bg-red-50">
                  {(customizedResult.originalResumeText || resume.extractedText || '').substring(0, 1000)}{(customizedResult.originalResumeText || resume.extractedText || '').length > 1000 ? '...' : ''}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Customized Resume
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border rounded p-3 bg-green-50">
                  {customizedResult.customizedResume.customizedText.substring(0, 1000)}{customizedResult.customizedResume.customizedText.length > 1000 ? '...' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


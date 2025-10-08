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
  const [customizedResultB, setCustomizedResultB] = useState<any>(null)
  const [diffHtml, setDiffHtml] = useState<string>('')
  const [diffHtmlB, setDiffHtmlB] = useState<string>('')
  const [ats, setAts] = useState<any>(null)
  const [atsB, setAtsB] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('preview')
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A')
  const [authenticity, setAuthenticity] = useState<{ score: number; suggestions: string[] } | null>(null)
  const [authenticityB, setAuthenticityB] = useState<{ score: number; suggestions: string[] } | null>(null)
  const [tone, setTone] = useState<'professional'|'enthusiastic'|'concise'>('professional')
  const [autoTone, setAutoTone] = useState<boolean>(false)
  const [generateVariantB, setGenerateVariantB] = useState<boolean>(true)
  const [overrideText, setOverrideText] = useState<string>(()=>{ try { return localStorage.getItem('resume:override') || '' } catch { return '' } })
  const [templateId, setTemplateId] = useState<string>(()=>{ try { return localStorage.getItem('resume:template') || 'classic' } catch { return 'classic' } })
  const [styleHumanize, setStyleHumanize] = useState<boolean>(true)
  const [styleTone, setStyleTone] = useState<'professional'|'enthusiastic'|'concise'>(tone)
  const [availableTemplates, setAvailableTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [liveHighlights, setLiveHighlights] = useState<boolean>(false)
  const [highlighted, setHighlighted] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/resume/templates')
        if (r.ok) {
          const j = await r.json()
          setAvailableTemplates((j.templates || []).map((t: any)=>({ id: t.id, name: t.name })))
        }
      } catch {}
    })()
  }, [])

  // Live keyword coverage highlights in override editor
  useEffect(() => {
    if (!liveHighlights) return
    try {
      const kws = (jobAnalysis?.keywords || []).slice(0, 30).map(k => k.toLowerCase())
      const text = (overrideText && overrideText.length > 30 ? overrideText : resume.extractedText || '')
      if (!text) { setHighlighted(''); return }
      const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      let html = safe
      for (const kw of kws) {
        const re = new RegExp(`(\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b)`, 'gi')
        html = html.replace(re, '<mark class="bg-green-200">$1</mark>')
      }
      setHighlighted(html)
    } catch { setHighlighted('') }
  }, [liveHighlights, overrideText, resume.extractedText, jobAnalysis])

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
      const progressInterval = setInterval(() => {
        setCustomizationProgress(prev => Math.min(prev + 15, 88))
      }, 300)

      let psychology: any | undefined
      try { const stored = localStorage.getItem('analyze:psychology'); if (stored) psychology = JSON.parse(stored) } catch {}

      const requestPayload = (t: 'professional'|'enthusiastic'|'concise') => ({
        resumeId: resume._id,
        jobDescription: `Title: ${jobAnalysis.analysis.jobTitle}\nCompany: ${jobAnalysis.analysis.companyName}\n\nRequirements: ${jobAnalysis.analysis.keyRequirements.join(', ')}\nSkills: ${jobAnalysis.analysis.preferredSkills.join(', ')}\nResponsibilities: ${jobAnalysis.analysis.responsibilities.join(', ')}\nCulture: ${jobAnalysis.analysis.companyCulture.join(', ')}`,
        jobTitle: jobAnalysis.analysis.jobTitle,
        companyName: jobAnalysis.analysis.companyName,
        tone: t,
        overrideResumeText: overrideText && overrideText.length > 50 ? overrideText : undefined,
        psychology,
        style: { humanize: styleHumanize, tone: styleTone },
        templateId
      })

      // Variant A
      const resA = await fetch('/api/resume/customize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestPayload(tone)) })
      if (!resA.ok) { const e = await resA.json().catch(()=>({})); throw new Error((e as any).error || 'Customization failed') }
      const dataA = await resA.json()
      setCustomizedResult(dataA)
      onCustomizationComplete(dataA.customizedResume)

      // Diff A
      try {
        const beforeText = (dataA.originalResumeText || resume.extractedText || '') as string
        const afterText = dataA.customizedResume.customizedText as string
        const beforeTokens = beforeText.split(/\s+/)
        const afterTokens = afterText.split(/\s+/)
        const pieces: string[] = []
        let ai = 0, bi = 0
        while (ai < afterTokens.length && bi < beforeTokens.length) {
          if (afterTokens[ai] === beforeTokens[bi]) { pieces.push(afterTokens[ai]); ai++; bi++ } else {
            const start = ai
            let window = 0
            while (ai < afterTokens.length && window < 20 && afterTokens[ai] !== beforeTokens[bi]) { ai++; window++ }
            const added = afterTokens.slice(start, ai).join(' ')
            if (added) pieces.push(`<mark class="bg-yellow-200">${added}</mark>`) 
          }
        }
        if (ai < afterTokens.length) { pieces.push(`<mark class=\"bg-yellow-200\">${afterTokens.slice(ai).join(' ')}</mark>`) }
        setDiffHtml(pieces.join(' '))
      } catch {}

      // ATS A
      try {
        const resp = await fetch('/api/insights/ats/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText: dataA.customizedResume.customizedText, jobAnalysis }) })
        if (resp.ok) { const j = await resp.json(); setAts(j.ats) }
        else {
          const reqId = resp.headers.get('x-request-id') || ''
          if (resp.status === 429) toast.error('ATS scoring rate limited' + (reqId ? ` (Ref: ${reqId})` : ''))
        }
      } catch {}

      // Authenticity A
      try {
        const ar = await fetch('/api/insights/authenticity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalText: resume.extractedText, generatedText: dataA.customizedResume.customizedText }) })
        if (ar.ok) { const aj = await ar.json(); setAuthenticity(aj.authenticity) }
      } catch {}

      // Variant B (optional)
      if (generateVariantB) {
        const altTone: 'professional'|'enthusiastic'|'concise' = tone === 'professional' ? 'concise' : 'professional'
        const resB = await fetch('/api/resume/customize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestPayload(altTone)) })
        if (resB.ok) {
          const dataB = await resB.json()
          setCustomizedResultB(dataB)
          // Diff B
          try {
            const beforeText = (dataB.originalResumeText || resume.extractedText || '') as string
            const afterText = dataB.customizedResume.customizedText as string
            const beforeTokens = beforeText.split(/\s+/)
            const afterTokens = afterText.split(/\s+/)
            const piecesB: string[] = []
            let ai = 0, bi = 0
            while (ai < afterTokens.length && bi < beforeTokens.length) {
              if (afterTokens[ai] === beforeTokens[bi]) { piecesB.push(afterTokens[ai]); ai++; bi++ } else {
                const start = ai
                let window = 0
                while (ai < afterTokens.length && window < 20 && afterTokens[ai] !== beforeTokens[bi]) { ai++; window++ }
                const added = afterTokens.slice(start, ai).join(' ')
                if (added) piecesB.push(`<mark class=\"bg-yellow-200\">${added}</mark>`) 
              }
            }
            if (ai < afterTokens.length) { piecesB.push(`<mark class=\"bg-yellow-200\">${afterTokens.slice(ai).join(' ')}</mark>`) }
            setDiffHtmlB(piecesB.join(' '))
          } catch {}
          // ATS B
          try {
            const respB = await fetch('/api/insights/ats/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText: dataB.customizedResume.customizedText, jobAnalysis }) })
            if (respB.ok) { const j = await respB.json(); setAtsB(j.ats) }
          } catch {}
          // Authenticity B
          try {
            const arB = await fetch('/api/insights/authenticity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalText: resume.extractedText, generatedText: dataB.customizedResume.customizedText }) })
            if (arB.ok) { const ajB = await arB.json(); setAuthenticityB(ajB.authenticity) }
          } catch {}
        }
      }

      clearInterval(progressInterval)
      setCustomizationProgress(100)
      try { if (overrideText) localStorage.setItem('resume:override', overrideText) } catch {}
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

  const activeData = activeVariant === 'A' ? customizedResult : customizedResultB
  const activeAts = activeVariant === 'A' ? ats : atsB
  const activeDiff = activeVariant === 'A' ? diffHtml : diffHtmlB
  const activeAuth = activeVariant === 'A' ? authenticity : authenticityB

  const downloadResume = async () => {
    const data = activeData
    if (!data) return
    const safeUser = (resume.userName || '').replace(/\s+/g,'_')
    const safeCompany = (jobAnalysis.analysis.companyName || 'Company').replace(/\s+/g,'_')
    const fileName = `${safeUser ? safeUser + '_' : ''}Resume_${safeCompany}`
    try {
      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      const lines = (data.customizedResume.customizedText || '').split(/\r?\n/)
      const headingRe = /^(Professional Summary|Core Competencies|Skills|Professional Experience|Experience|Education|Certifications)\s*$/i
      const parts: string[] = []
      for (const line of lines) {
        if (!line.trim()) { parts.push('<div class="sp">&nbsp;</div>'); continue }
        if (headingRe.test(line.trim())) {
          parts.push(`<div class="section"><strong>${esc(line.trim())}</strong></div>`)
          continue
        }
        if (line.trim().startsWith('• ')) {
          parts.push(`<div class="bullet">${esc(line.trim())}</div>`)
          continue
        }
        parts.push(`<div class="line">${esc(line)}</div>`)
      }
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>
        body{font-family:Arial,Segoe UI,Helvetica,sans-serif;font-size:11pt;line-height:1.55;color:#111;max-width:8.5in;margin:0 auto;padding:0.7in;background:#fff}
        .section{margin-top:14px;margin-bottom:4px;font-size:11.2pt}
        .bullet{margin-left:14px;text-indent:-10px;padding-left:10px}
        .line{white-space:pre-wrap}
        .sp{height:6px}
      </style></head><body>${parts.join('')}</body></html>`
      const resp = await fetch('/api/resume/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html, filename: `${fileName}.pdf` }) })
      if (resp.ok) {
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Resume PDF downloaded!')
      } else {
        // Fallback to .txt
        const blob = new Blob([data.customizedResume.customizedText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Resume downloaded!')
      }
    } catch {
      const blob = new Blob([data.customizedResume.customizedText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Resume downloaded!')
    }
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
              <p className="text-sm font-medium text-muted-foreground">Tone guidance</p>
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
              <p className="text-sm font-medium text-muted-foreground">Template</p>
              <Select value={templateId} onValueChange={(v)=>{ setTemplateId(v); try { localStorage.setItem('resume:template', v) } catch {} }}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {(availableTemplates.length ? availableTemplates : [
                    { id: 'classic', name: 'Classic (ATS Safe)' },
                    { id: 'modern', name: 'Modern (ATS Safe)' },
                    { id: 'compact', name: 'Compact (ATS Safe)' },
                  ]).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Auto-tone from Psychology</p>
              <button type="button" onClick={()=>setAutoTone(v=>!v)} className={`px-3 py-2 border rounded text-sm ${autoTone ? 'bg-green-500/10 border-green-500' : 'bg-card'}`}>{autoTone ? 'Enabled' : 'Disabled'}</button>
              {autoTone && (
                <p className="text-xs text-muted-foreground">We’ll use the Analyze page’s tone if available</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Humanize Style</p>
              <button type="button" onClick={()=>setStyleHumanize(v=>!v)} className={`px-3 py-2 border rounded text-sm ${styleHumanize ? 'bg-green-500/10 border-green-500' : 'bg-card'}`}>{styleHumanize ? 'Enabled' : 'Disabled'}</button>
              <p className="text-xs text-muted-foreground">Reduce AI detectability patterns</p>
            </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Live Highlights</p>
            <button type="button" onClick={()=>setLiveHighlights(v=>!v)} className={`px-3 py-2 border rounded text-sm ${liveHighlights ? 'bg-yellow-500/10 border-yellow-500' : 'bg-card'}`}>{liveHighlights ? 'On' : 'Off'}</button>
            <p className="text-xs text-muted-foreground">Highlight covered keywords in the editor</p>
          </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Generate A/B Variants</p>
              <button type="button" onClick={()=>setGenerateVariantB(v=>!v)} className={`px-3 py-2 border rounded text-sm ${generateVariantB ? 'bg-blue-500/10 border-blue-500' : 'bg-card'}`}>{generateVariantB ? 'A & B' : 'A only'}</button>
              <p className="text-xs text-muted-foreground">Two tailored variants for side-by-side comparison</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Optional: Override Resume Text</p>
            {!liveHighlights ? (
              <Textarea rows={6} placeholder="Paste clean resume text to override extraction (optional)" value={overrideText} onChange={(e)=>setOverrideText(e.target.value)} />
            ) : (
              <div className="border rounded p-3 bg-background text-foreground text-sm max-h-48 overflow-y-auto" dangerouslySetInnerHTML={{ __html: highlighted || (overrideText || resume.extractedText || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }} />
            )}
            <p className="text-xs text-muted-foreground">Use this if the PDF text extraction contained gibberish. Minimum 50 characters.</p>
          </div>
          {/* Job Match Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Job</p>
                  <p className="text-lg font-semibold">{jobAnalysis.analysis.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">{jobAnalysis.analysis.companyName}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Keywords Found</p>
                  <p className="text-lg font-semibold">{jobAnalysis.keywords.length}</p>
                  <p className="text-sm text-muted-foreground">relevant terms</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                  <p className="text-lg font-semibold">{jobAnalysis.analysis.experienceLevel}</p>
                  <p className="text-sm text-muted-foreground">required</p>
                </div>
              </div>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isCustomizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customizing resume...</span>
                <span className="text-sm text-muted-foreground">{customizationProgress}%</span>
              </div>
              <Progress value={customizationProgress} className="w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-40 md:col-span-2" />
              </div>
            </div>
          )}

          {!customizedResult && (
            <Button onClick={handleCustomize} disabled={isCustomizing} size="lg" className="w-full">
              {isCustomizing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Customizing Resume...</>) : (<><Wand2 className="mr-2 h-4 w-4" /> Customize Resume with AI</>) }
            </Button>
          )}
        </CardContent>
      </Card>

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
                <Button variant="outline" onClick={async ()=>{
                  try {
                    const appId = customizedResult?.jobApplication?._id || customizedResultB?.jobApplication?._id
                    if (!appId) { toast.error('Missing application id'); return }
                    const resp = await fetch(`/api/applications/${appId}/export/pack`)
                    if (resp.ok) {
                      const blob = await resp.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${jobAnalysis.analysis.companyName}_${jobAnalysis.analysis.jobTitle}_ApplicationPack.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); toast.success('Pack downloaded')
                    } else {
                      toast.error('Failed to export pack')
                    }
                  } catch { toast.error('Failed to export pack') }
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Pack
                </Button>
                <Button variant="outline" onClick={async ()=>{
                  try {
                    const appId = customizedResult?.jobApplication?._id || customizedResultB?.jobApplication?._id
                    if (!appId) { toast.error('Missing application id'); return }
                    const resp = await fetch(`/api/applications/${appId}/export/zip`)
                    if (resp.ok) {
                      const blob = await resp.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${jobAnalysis.analysis.companyName}_${jobAnalysis.analysis.jobTitle}_ApplicationPack.bundle`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); toast.success('Bundle downloaded')
                    } else { toast.error('Failed to export bundle') }
                  } catch { toast.error('Failed to export bundle') }
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Bundle
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
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground">Customized Resume</h4>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={activeVariant === 'A' ? 'secondary' : 'outline'} onClick={()=>setActiveVariant('A')}>Variant A</Button>
                      <Button size="sm" variant={activeVariant === 'B' ? 'secondary' : 'outline'} onClick={()=>setActiveVariant('B')} disabled={!customizedResultB}>Variant B</Button>
                      <Badge variant="secondary">{(activeData?.matchScore ?? 0)}% Match Score</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto border rounded p-4 bg-background">
                    {activeData?.customizedResume?.customizedText}
                  </div>
                  {activeAuth && (
                    <div className="mt-3 text-sm text-foreground">
                      <div className="font-medium">Authenticity Score: {activeAuth.score}/100</div>
                      {activeAuth.suggestions.length > 0 && (
                        <ul className="list-disc ml-5 mt-1">
                          {activeAuth.suggestions.slice(0,3).map((s, i)=>(<li key={i}>{s}</li>))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Changes Highlighted</h4>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={activeVariant === 'A' ? 'secondary' : 'outline'} onClick={()=>setActiveVariant('A')}>Variant A</Button>
                      <Button size="sm" variant={activeVariant === 'B' ? 'secondary' : 'outline'} onClick={()=>setActiveVariant('B')} disabled={!customizedResultB}>Variant B</Button>
                    </div>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap max-h-96 overflow-y-auto border border-border rounded p-4 bg-background" dangerouslySetInnerHTML={{ __html: activeDiff || activeData?.customizedResume?.customizedText?.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') || '' }} />
                  <div className="text-xs text-muted-foreground mt-2">New or significantly changed text is highlighted.</div>
                </div>

                {activeAts && (
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">ATS Optimization</h4>
                      <Badge variant="secondary">{activeAts.score}/100</Badge>
                    </div>
                    <div className="text-xs text-foreground">Missing keywords:</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {activeAts.missingKeywords.slice(0, 20).map((k: string, i: number) => (
                        <Badge key={i} variant="outline">{k}</Badge>
                      ))}
                    </div>
                    {activeAts.suggestions?.length > 0 && (
                      <ul className="list-disc ml-5 mt-2 text-sm text-foreground">
                        {activeAts.suggestions.map((s: string, i: number) => (<li key={i}>{s}</li>))}
                      </ul>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="improvements" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Applied Improvements ({activeVariant})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(activeData?.improvements || []).map((improvement: string, index: number) => (
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
                  <h4 className="font-medium text-foreground">Additional Suggestions ({activeVariant})</h4>
                  <div className="space-y-3">
                    {(activeData?.suggestions || []).map((suggestion: string, index: number) => (
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
            <div className="flex items-center gap-2 mb-3">
              <Button size="sm" variant={activeVariant === 'A' ? 'secondary' : 'outline'} onClick={()=>setActiveVariant('A')}>Variant A</Button>
              <Button size="sm" variant={activeVariant === 'B' ? 'secondary' : 'outline'} onClick={()=>setActiveVariant('B')} disabled={!customizedResultB}>Variant B</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Original Resume
                </h4>
                <div className="text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto border rounded p-3 bg-red-500/10">
                  {(customizedResult.originalResumeText || resume.extractedText || '').substring(0, 1000)}{(customizedResult.originalResumeText || resume.extractedText || '').length > 1000 ? '...' : ''}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Customized Resume (Variant {activeVariant})
                </h4>
                <div className="text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto border rounded p-3 bg-green-500/10">
                  {(activeData?.customizedResume?.customizedText || '').substring(0, 1000)}{(activeData?.customizedResume?.customizedText || '').length > 1000 ? '...' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


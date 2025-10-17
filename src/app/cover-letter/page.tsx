'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Download, Loader2 } from 'lucide-react'
import { useResumeContext } from '@/components/resume-context'
import toast from 'react-hot-toast'
import { CoverLetterSkeleton } from '@/components/skeleton-loader'

export default function CoverLetterPage() {
  const { selectedResume, resumes, setSelectedResumeId, refresh } = useResumeContext()
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [tone, setTone] = useState<'professional' | 'casual' | 'enthusiastic'>('professional')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const generate = async () => {
    // Use current state or fall back to selected resume text immediately
    const rt = (resumeText && resumeText.trim().length > 0)
      ? resumeText
      : (selectedResume?.extractedText || '')
    if (!resumeText && selectedResume?.extractedText) {
      // Update state for UI, but don't wait for it to set before sending request
      setResumeText(selectedResume.extractedText)
    }
    if (!jobTitle.trim() || !companyName.trim() || !jobDescription || jobDescription.trim().length < 50) {
      toast.error('Fill job title, company, and at least 50 chars of job description')
      return
    }
    if (!rt || rt.trim().length < 50) {
      toast.error('Add your resume text (50+ chars) or upload/select a resume')
      return
    }
    setIsLoading(true)
    try {
      let psychology: any | undefined
      try { const stored = localStorage.getItem('analyze:psychology'); if (stored) psychology = JSON.parse(stored) } catch {}
      const resp = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: true,
          jobTitle,
          companyName,
          jobDescription,
          resumeText: rt,
          tone,
          length,
          psychology
        })
      })
      if (!resp.ok) {
        const reqId = resp.headers.get('x-request-id') || ''
        const data = await resp.json().catch(() => ({})) as any
        if (resp.status === 401) {
          toast.error('Session expired. Please sign in again.' + (reqId ? ` (Ref: ${reqId})` : ''))
          try { window.location.href = '/auth/signin' } catch {}
          return
        }
        if (resp.status === 429) {
          toast.error((data?.error || 'Rate limit exceeded') + (reqId ? ` (Ref: ${reqId})` : ''))
          return
        }
        if (resp.status >= 500) {
          toast.error('Server error while generating cover letter.' + (reqId ? ` (Ref: ${reqId})` : ''))
          return
        }
        throw new Error(data?.error || 'Failed to generate cover letter')
      }
      const data = await resp.json()
      const txt: string = data.coverLetter || ''
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;color:#111;max-width:8.5in;margin:0 auto;padding:0.7in;white-space:pre-wrap}</style></head><body>${txt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
      setPreviewHtml(html)
      toast.success('Cover letter generated!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Auto-fill Resume Text from selected resume when available
    const fill = async () => {
      try {
        if (!selectedResume && (!resumes || resumes.length === 0)) {
          await refresh()
        }
        const current = selectedResume || (resumes && resumes[0])
        if (current && !resumeText) {
          setResumeText(current.extractedText || '')
        }
      } catch {}
    }
    fill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResume, resumes])

  // Auto-fill job fields from last Analyze/selection
  useEffect(() => {
    try {
      if (!jobTitle) {
        const jt = localStorage.getItem('job:title')
        if (jt) setJobTitle(jt)
      }
      if (!companyName) {
        const cn = localStorage.getItem('job:company')
        if (cn) setCompanyName(cn)
      }
      if (!jobDescription) {
        const jd = localStorage.getItem('job:description')
        if (jd) setJobDescription(jd)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist job fields to localStorage for cross-app autofill
  useEffect(() => {
    try { if (jobTitle) localStorage.setItem('job:title', jobTitle) } catch {}
  }, [jobTitle])
  useEffect(() => {
    try { if (companyName) localStorage.setItem('job:company', companyName) } catch {}
  }, [companyName])
  useEffect(() => {
    try { if (jobDescription) localStorage.setItem('job:description', jobDescription) } catch {}
  }, [jobDescription])

  const downloadPdf = async () => {
    if (!previewHtml) return
    try {
      const resp = await fetch('/api/resume/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: previewHtml,
          filename: `${companyName || 'Company'}_${jobTitle || 'CoverLetter'}.pdf`
        })
      })
      if (!resp.ok) throw new Error('Failed to export PDF')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${companyName || 'Company'}_${jobTitle || 'CoverLetter'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to export')
    }
  }

  const saveLetter = async () => {
    if (!previewHtml) {
      toast.error('Generate a cover letter first')
      return
    }
    setIsSaving(true)
    try {
      const resp = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: true,
          save: true,
          jobTitle,
          companyName,
          jobDescription,
          resumeText,
          tone,
          length,
        })
      })
      if (!resp.ok) {
        const reqId = resp.headers.get('x-request-id') || ''
        const data = await resp.json().catch(() => ({})) as any
        if (resp.status === 401) {
          toast.error('Session expired. Please sign in again.' + (reqId ? ` (Ref: ${reqId})` : ''))
          try { window.location.href = '/auth/signin' } catch {}
          return
        }
        if (resp.status === 429) {
          toast.error((data?.error || 'Rate limit exceeded') + (reqId ? ` (Ref: ${reqId})` : ''))
          return
        }
        if (resp.status >= 500) {
          toast.error('Server error while saving cover letter.' + (reqId ? ` (Ref: ${reqId})` : ''))
          return
        }
        throw new Error(data?.error || 'Failed to save')
      }
      toast.success('Cover letter saved!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Cover Letter</CardTitle>
          <CardDescription>Paste the job description and your resume. Choose tone and length, then generate a preview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Software Engineer" />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Acme Corp" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Job Description</Label>
            <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} placeholder="Paste the job description here" />
          </div>

          <div className="space-y-2">
            <Label>Resume Text</Label>
            <Textarea value={resumeText || selectedResume?.extractedText || ''} onChange={(e) => setResumeText(e.target.value)} rows={8} placeholder={selectedResume ? 'Using your uploaded resume. You can override here.' : 'Paste your resume text here'} />
            {!selectedResume && (
              <div className="text-xs text-muted-foreground">Tip: upload a resume first so it’s auto-filled across the app.</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generate} disabled={isLoading} className="w-full">
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : 'Generate Cover Letter'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Review your cover letter before downloading.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <CoverLetterSkeleton />
          ) : previewHtml ? (
            <>
              <div className="border rounded overflow-hidden">
                <iframe srcDoc={previewHtml} className="w-full h-96 border-0" title="Cover Letter Preview" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button onClick={downloadPdf} className="w-full"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                <Button onClick={saveLetter} disabled={isSaving} variant="outline" className="w-full">
                  {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : 'Save to Applications'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No preview yet. Fill the form and click Generate.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




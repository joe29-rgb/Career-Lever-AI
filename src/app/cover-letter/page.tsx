'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CoverLetterPage() {
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
    setIsLoading(true)
    try {
      const resp = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: true,
          jobTitle,
          companyName,
          jobDescription,
          resumeText,
          tone,
          length,
        })
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error((data as any).error || 'Failed to generate cover letter')
      }
      const data = await resp.json()
      setPreviewHtml(data.preview?.html || null)
      toast.success('Cover letter generated!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setIsLoading(false)
    }
  }

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
        const data = await resp.json().catch(() => ({}))
        throw new Error((data as any).error || 'Failed to save')
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
            <Textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={8} placeholder="Paste your resume text here" />
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
          {previewHtml ? (
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
            <div className="text-sm text-gray-600">No preview yet. Fill the form and click Generate.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



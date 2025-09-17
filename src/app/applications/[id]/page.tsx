'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function highlightKeywords(text: string, keywords: string[]): string {
  if (!text) return ''
  if (!keywords || keywords.length === 0) return text
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean)
  if (escaped.length === 0) return text
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

export default function ApplicationDetailsPage() {
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [attachId, setAttachId] = useState('')
  const [attaching, setAttaching] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`/api/applications/${params.id}`)
        if (!resp.ok) throw new Error('Failed to load application')
        const json = await resp.json()
        setData(json)
      } catch (e) {
        toast.error('Failed to load application')
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) load()
  }, [params?.id])

  const downloadResumeVersion = async (html: string, name: string) => {
    const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name}</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${html.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
    try {
      const resp = await fetch('/api/resume/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: wrapped, filename: `${name}.pdf` }) })
      if (!resp.ok) throw new Error('Failed')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download')
    }
  }

  const attachCoverLetter = async () => {
    if (!attachId) { toast.error('Select a cover letter'); return }
    setAttaching(true)
    try {
      const resp = await fetch(`/api/applications/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coverLetterId: attachId }) })
      if (!resp.ok) throw new Error('Failed to attach')
      toast.success('Cover letter attached')
    } catch (e) {
      toast.error('Failed to attach cover letter')
    } finally {
      setAttaching(false)
    }
  }

  const exportPack = async () => {
    try {
      const resp = await fetch(`/api/applications/${params.id}/export/pack`)
      if (!resp.ok) throw new Error('Failed to export pack')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.application.companyName}_${data.application.jobTitle}_ApplicationPack.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  const attachLatest = async () => {
    try {
      const resp = await fetch(`/api/applications/${params.id}/attach`, { method: 'POST' })
      if (!resp.ok) throw new Error('Attach failed')
      toast.success('Attached latest tailored resume and recent cover letter')
    } catch {
      toast.error('Failed to attach latest assets')
    }
  }

  const [followEmail, setFollowEmail] = useState<{ subject: string; body: string } | null>(null)
  const [followDates, setFollowDates] = useState<Date[] | null>(null)
  const suggestFollowUp = async () => {
    try {
      const resp = await fetch(`/api/applications/${params.id}/followup/suggest`)
      if (!resp.ok) throw new Error('Failed to suggest follow-up')
      const j = await resp.json()
      setFollowEmail(j.email)
      setFollowDates((j.dates || []).map((d: string) => new Date(d)))
    } catch {
      toast.error('Failed to suggest follow-up')
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading...</div>
  if (!data?.success) return <div className="p-6 text-sm text-red-600">Failed to load application.</div>

  const { application, coverLetter, resume } = data
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{application.jobTitle} @ {application.companyName}</CardTitle>
          <CardDescription>Application details and artifacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Job Description</Label>
            <div className="border rounded p-2 text-sm bg-white" dangerouslySetInnerHTML={{ __html: highlightKeywords(application.jobDescription || '', (application.analysis?.keyRequirements || []).concat(application.analysis?.preferredSkills || [])) }} />
          </div>

          <div>
            <Label>Job Analysis</Label>
            <Textarea readOnly rows={8} value={JSON.stringify(application.analysis || {}, null, 2)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover Letter</CardTitle>
          <CardDescription>Attach a saved cover letter or preview the current attachment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {coverLetter ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-700">Attached: {coverLetter.jobTitle} @ {coverLetter.companyName}</div>
              <Button onClick={() => downloadResumeVersion(coverLetter.content, `${application.companyName}_${application.jobTitle}_CoverLetter`)}><Download className="h-4 w-4 mr-1" /> Download PDF</Button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No cover letter attached.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={attachId} onValueChange={setAttachId}>
              <SelectTrigger><SelectValue placeholder="Select saved cover letter" /></SelectTrigger>
              <SelectContent>
                {/* This could be populated via client-side fetch to /api/cover-letter/list; keeping simple here */}
                <SelectItem value="">None</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={attachCoverLetter} disabled={attaching}>{attaching ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin"/> Attaching...</>) : 'Attach'}</Button>
            <a className="inline-flex items-center justify-center border rounded px-3 py-2" href="/cover-letter">Create New</a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Original upload and tailored versions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label>Original (extracted)</Label>
              {resume?.original?.fileUrl && (
                <a href={resume.original.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Download original upload</a>
              )}
            </div>
            <div className="border rounded p-2 text-sm bg-white" dangerouslySetInnerHTML={{ __html: highlightKeywords(resume?.original?.extractedText || '', (application.analysis?.keyRequirements || []).concat(application.analysis?.preferredSkills || [])) }} />
          </div>
          <div className="space-y-2">
            <Label>Tailored Versions</Label>
            {(!resume?.versions || resume.versions.length === 0) ? (
              <div className="text-sm text-gray-600">No tailored versions yet.</div>
            ) : (
              <div className="space-y-3">
                {resume.versions.map((v: any) => (
                  <div key={v._id} className="border rounded p-3">
                    <div className="text-sm text-gray-700 mb-2">{v.jobTitle} @ {v.companyName} — Match: {v.matchScore ?? 0}%</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => downloadResumeVersion(v.customizedText, `${application.companyName}_${application.jobTitle}_Resume`)}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                      <details className="ml-2">
                        <summary className="cursor-pointer text-xs text-gray-600">Preview Changes</summary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="text-xs">
                            <div className="text-gray-500 mb-1">Original</div>
                            <div className="border rounded p-2 bg-white" dangerouslySetInnerHTML={{ __html: highlightKeywords(resume?.original?.extractedText || '', (application.analysis?.keyRequirements || []).concat(application.analysis?.preferredSkills || [])) }} />
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-500 mb-1">Tailored</div>
                            <div className="border rounded p-2 bg-white" dangerouslySetInnerHTML={{ __html: highlightKeywords(v.customizedText || '', (application.analysis?.keyRequirements || []).concat(application.analysis?.preferredSkills || [])) }} />
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Pack</CardTitle>
            <CardDescription>Export tailored resume + cover letter + talking points</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={exportPack} className="flex-1"><Download className="h-4 w-4 mr-1" /> Export Application Pack</Button>
            <Button variant="outline" onClick={attachLatest} className="flex-1">Attach Latest Resume + Cover Letter</Button>
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up</CardTitle>
            <CardDescription>Suggest dates and generate email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={suggestFollowUp}>Suggest Dates & Email</Button>
            {followDates && (
              <div className="text-sm text-gray-700">Suggested dates: {followDates.map(d=>d.toLocaleDateString()).join(', ')}</div>
            )}
            {followEmail && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Subject</div>
                <div className="text-sm text-gray-800">{followEmail.subject}</div>
                <div className="text-sm font-medium">Body</div>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">{followEmail.body}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



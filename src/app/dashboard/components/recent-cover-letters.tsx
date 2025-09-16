'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function RecentCoverLetters() {
  const [letters, setLetters] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch('/api/cover-letter/list')
        if (!resp.ok) throw new Error('Failed to load cover letters')
        const data = await resp.json()
        setLetters(data.letters || [])
      } catch (e) {
        toast.error('Failed to load cover letters')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const download = async (content: string, fileName: string) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
    try {
      const resp = await fetch('/api/resume/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html, filename: `${fileName}.pdf` }) })
      if (!resp.ok) throw new Error('Failed')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Cover Letters</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        ) : letters.length === 0 ? (
          <div className="text-sm text-gray-600">No cover letters yet.</div>
        ) : (
          <div className="space-y-3">
            {letters.map((l) => (
              <div key={l._id} className="flex items-center justify-between border rounded p-3">
                <div className="text-sm">
                  <div className="font-medium">{l.jobTitle} @ {l.companyName}</div>
                  <div className="text-gray-500">{new Date(l.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => download(l.content, `${l.companyName}_${l.jobTitle}`)}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <a href="/cover-letter" className="inline-flex items-center text-sm px-3 py-2 border rounded">
                    <FileText className="h-4 w-4 mr-1" /> New
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}



'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CareerFinderCoverLetterPage() {
  const [loading, setLoading] = useState(true)
  const [letterA, setLetterA] = useState('')
  const [letterB, setLetterB] = useState('')
  const [selected, setSelected] = useState<'A'|'B'|'none'>('none')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try { localStorage.setItem('cf:progress', JSON.stringify({ step: 6, total: 7 })) } catch {}
      setLoading(true)
      try {
        // Pull selected template/tone and selected resume variant
        let chosenTone = 'professional'
        try { const t = localStorage.getItem('cf:tone'); if (t) chosenTone = t } catch {}
        let selectedHtml = ''
        try { selectedHtml = localStorage.getItem('cf:selectedResumeHtml') || '' } catch {}

        // Load resume text (fallback)
        let resumeText = ''
        try {
          const rl = await fetch('/api/resume/list')
          if (rl.ok) {
            const rj = await rl.json()
            resumeText = (rj?.resumes?.[0]?.extractedText || '').toString().slice(0, 8000)
          }
        } catch {}
        // Load selected job
        let selectedJob: any = null
        try { selectedJob = JSON.parse(localStorage.getItem('cf:selectedJob') || 'null') } catch {}
        const jobTitle = selectedJob?.title || 'Role'
        const companyName = selectedJob?.company || 'Company'
        const jobDescription = (selectedJob?.description || '').toString().slice(0, 8000)
        // Load company insights (auto) to provide culture/news/contacts
        let companyData: any = null
        try {
          const website = (()=>{ try{ const u=new URL(selectedJob?.url||''); return 'https://'+u.hostname.replace(/^www\./,'') }catch{return ''} })()
          const cr = await fetch('/api/v2/company/deep-research', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ companyName, website: website || undefined, jobTitle: jobTitle || undefined }) })
          if (cr.ok) {
            const cj = await cr.json()
            companyData = cj.companyData || cj.research || null
          }
        } catch {}
        // Extract company tone/psychology for styling
        let psychology: any = null
        try {
          if (jobDescription) {
            const p = await fetch('/api/insights/psychology', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ jobDescription, companySignals: companyData || {} }) })
            const pj = await p.json().catch(()=>({}))
            if (p.ok && pj.psychology) psychology = pj.psychology
          }
        } catch {}
        const payload = { raw: true, jobTitle, companyName, jobDescription, resumeText: (selectedHtml || resumeText), companyData, psychology, save: false }
        // Generate two variants by tweaking tone/length
        const [ra, rb] = await Promise.all([
          fetch('/api/cover-letter/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, tone: chosenTone || 'professional', length: 'medium' }) }),
          fetch('/api/cover-letter/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, tone: (chosenTone === 'professional' ? 'conversational' : 'professional'), length: 'short' }) })
        ])
        const ja = await ra.json().catch(()=>({}))
        const jb = await rb.json().catch(()=>({}))
        if (ra.ok && ja.coverLetter) setLetterA(ja.coverLetter)
        if (rb.ok && jb.coverLetter) setLetterB(jb.coverLetter)
        if ((!ra.ok || !rb.ok) && !ja.coverLetter && !jb.coverLetter) setError('Failed to generate cover letters')
      } catch {}
      setLoading(false)
    })()
  }, [])

  const saveSelection = () => {
    try {
      const chosen = selected === 'A' ? letterA : letterB
      localStorage.setItem('cf:selectedCoverLetter', chosen || '')
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">Choose one of the generated cover letters.</div>
      {loading && <div className="text-sm">Generating letters…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`border rounded p-3 text-sm ${selected==='A'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('A')}>
            <div className="text-xs text-gray-500 mb-2">Option A</div>
            <div className="whitespace-pre-wrap">{letterA || 'No content'}</div>
          </div>
          <div className={`border rounded p-3 text-sm ${selected==='B'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('B')}>
            <div className="text-xs text-gray-500 mb-2">Option B</div>
            <div className="whitespace-pre-wrap">{letterB || 'No content'}</div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">Selected: {selected}</div>
        <Link className={`inline-block px-4 py-2 border rounded ${selected==='none'?'pointer-events-none opacity-50':''}`} href="/career-finder/outreach" onClick={saveSelection}>Next</Link>
      </div>
    </div>
  )
}




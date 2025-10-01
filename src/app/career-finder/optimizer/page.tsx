'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const TEMPLATES = [
  { id: 'modern', name: 'Modern' },
  { id: 'professional', name: 'Professional' },
  { id: 'creative', name: 'Creative' },
  { id: 'tech', name: 'Tech-Focused' },
]

export default function CareerFinderOptimizerPage() {
  const [template, setTemplate] = useState('modern')
  const [loading, setLoading] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [variantA, setVariantA] = useState<string>('')
  const [variantB, setVariantB] = useState<string>('')
  const [selected, setSelected] = useState<'A'|'B'|'none'>('none')

  useEffect(() => {
    (async () => {
      try {
        const rl = await fetch('/api/resume/list')
        if (rl.ok) {
          const rj = await rl.json()
          const txt: string = rj?.resumes?.[0]?.extractedText || ''
          setResumeText(txt)
        }
      } catch {}
    })()
  }, [])

  const generateVariants = async () => {
    setLoading(true)
    setVariantA(''); setVariantB('')
    try {
      const bodyBase = { resumeText: resumeText.slice(0, 8000), template, jobDescription: (JSON.parse(localStorage.getItem('cf:selectedJob')||'{}')?.description || '').toString().slice(0, 8000) }
      const [ra, rb] = await Promise.all([
        fetch('/api/resume-builder/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bodyBase, tone: 'professional' }) }),
        fetch('/api/resume-builder/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bodyBase, tone: 'conversational' }) })
      ])
      const ja = await ra.json().catch(()=>({}))
      const jb = await rb.json().catch(()=>({}))
      if (ra.ok && ja?.output?.html) setVariantA(ja.output.html)
      if (rb.ok && jb?.output?.html) setVariantB(jb.output.html)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (resumeText) generateVariants() }, [resumeText, template])

  const saveSelection = () => {
    try {
      const html = selected === 'A' ? variantA : variantB
      if (html) localStorage.setItem('cf:selectedResumeHtml', html)
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">Choose a template, generate A/B variants by tone, and select one to continue.</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {TEMPLATES.map(t => (
          <button key={t.id} className={`px-3 py-2 border rounded ${template===t.id?'bg-blue-50 border-blue-500':''}`} onClick={()=>setTemplate(t.id)}>{t.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`border rounded ${selected==='A'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('A')}>
          <div className="text-xs text-gray-500 p-2">Variant A (Professional)</div>
          <iframe className="w-full h-96 border-0" srcDoc={variantA || '<div class="p-3 text-xs text-gray-600">No content</div>'} />
        </div>
        <div className={`border rounded ${selected==='B'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('B')}>
          <div className="text-xs text-gray-500 p-2">Variant B (Conversational)</div>
          <iframe className="w-full h-96 border-0" srcDoc={variantB || '<div class="p-3 text-xs text-gray-600">No content</div>'} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">Selected: {selected}</div>
        <Link className={`inline-block px-4 py-2 border rounded ${selected==='none'?'pointer-events-none opacity-50':''}`} href="/career-finder/cover-letter" onClick={saveSelection}>Next</Link>
      </div>
      {loading && <div className="text-xs">Generating variants…</div>}
      <div className="text-right"><Button variant="outline" onClick={generateVariants} disabled={loading}>Regenerate</Button></div>
    </div>
  )
}




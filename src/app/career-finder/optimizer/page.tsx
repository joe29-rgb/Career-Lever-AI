'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

const TEMPLATES = [
  { id: 'modern', name: 'Modern' },
  { id: 'professional', name: 'Professional' },
  { id: 'creative', name: 'Creative' },
  { id: 'tech', name: 'Tech-Focused' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'executive', name: 'Executive' },
]

export default function CareerFinderOptimizerPage() {
  const [template, setTemplate] = useState('modern')
  const [loading, setLoading] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [variantA, setVariantA] = useState<string>('')
  const [variantB, setVariantB] = useState<string>('')
  const [selected, setSelected] = useState<'A'|'B'|'none'>('none')
  const [humanize, setHumanize] = useState(true)
  const [highlights, setHighlights] = useState(false)
  const [overrideText, setOverrideText] = useState('')
  const [tone, setTone] = useState<'professional'|'conversational'|'technical'>('professional')
  const [expanded, setExpanded] = useState<'A'|'B'|'none'>('none')
  const [editorHtml, setEditorHtml] = useState('')

  useEffect(() => {
    (async () => {
      try { localStorage.setItem('cf:progress', JSON.stringify({ step: 5, total: 7 })) } catch {}
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

  useEffect(() => {
    try { localStorage.setItem('cf:selectedTemplate', template) } catch {}
  }, [template])

  useEffect(() => {
    try { localStorage.setItem('cf:tone', tone) } catch {}
  }, [tone])

  const generateVariants = async () => {
    setLoading(true)
    setVariantA(''); setVariantB('')
    try {
      const bodyBase = { resumeText: (overrideText || resumeText).slice(0, 8000), template, jobDescription: (JSON.parse(localStorage.getItem('cf:selectedJob')||'{}')?.description || '').toString().slice(0, 8000), humanize, highlights }
      const [ra, rb] = await Promise.all([
        fetch('/api/resume-builder/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bodyBase, tone }) }),
        fetch('/api/resume-builder/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bodyBase, tone: tone === 'professional' ? 'conversational' : 'professional' }) })
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
    <div className="mobile-container space-y-4">
      <CareerFinderBackButton />
      <div className="text-sm text-foreground">Choose a template, generate A/B variants by tone, and select one to continue.</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
        {TEMPLATES.map(t => (
          <button key={t.id} className={`border rounded p-2 text-left ${template===t.id?'bg-blue-50 border-blue-500':''}`} onClick={()=>setTemplate(t.id)}>
            <div className="w-full h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2 overflow-hidden">
              <div className="h-3 bg-blue-500/60"></div>
              <div className="h-1.5 bg-gray-300 mt-1 w-3/4"></div>
              <div className="h-1.5 bg-gray-300 mt-1 w-2/3"></div>
            </div>
            <div className="font-medium truncate">{t.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">Thumbnail preview</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-foreground">
        <div className="flex items-center gap-2"><input id="humanize" type="checkbox" checked={humanize} onChange={(e)=>setHumanize(e.target.checked)} /><label htmlFor="humanize">Humanize style (reduce AI patterns)</label></div>
        <div className="flex items-center gap-2"><input id="highlights" type="checkbox" checked={highlights} onChange={(e)=>setHighlights(e.target.checked)} /><label htmlFor="highlights">Live keyword highlights</label></div>
        <div>
          <div className="mb-1">Optional: Override Resume Text</div>
          <textarea className="w-full border rounded p-2 h-24" placeholder="Paste to override uploaded resume text for this optimization only" value={overrideText} onChange={(e)=>setOverrideText(e.target.value)} />
        </div>
        <div>
          <div className="mb-1">Tone</div>
          <select className="w-full border rounded p-2" value={tone} onChange={(e)=>setTone(e.target.value as any)}>
            <option value="professional">Professional</option>
            <option value="conversational">Conversational</option>
            <option value="technical">Technical</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`border rounded ${selected==='A'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('A')}>
          <div className="text-xs text-muted-foreground p-2">Variant A (Professional)</div>
          <div className="flex items-center justify-end gap-2 px-2 pb-1">
            <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setEditorHtml(variantA); setExpanded('A') }}>Expand/Edit</Button>
          </div>
          <iframe className="w-full h-96 border-0" srcDoc={variantA || '<div class="p-3 text-xs text-muted-foreground">No content</div>'} />
        </div>
        <div className={`border rounded ${selected==='B'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('B')}>
          <div className="text-xs text-muted-foreground p-2">Variant B (Conversational)</div>
          <div className="flex items-center justify-end gap-2 px-2 pb-1">
            <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setEditorHtml(variantB); setExpanded('B') }}>Expand/Edit</Button>
          </div>
          <iframe className="w-full h-96 border-0" srcDoc={variantB || '<div class="p-3 text-xs text-muted-foreground">No content</div>'} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Selected: {selected}</div>
        <Link className={`inline-block px-4 py-2 border rounded ${selected==='none'?'pointer-events-none opacity-50':''}`} href="/career-finder/cover-letter" onClick={saveSelection}>Next</Link>
      </div>
      {loading && <div className="text-xs">Generating variants…</div>}
      <div className="text-right"><Button variant="outline" onClick={generateVariants} disabled={loading}>Regenerate</Button></div>

      {/* Expand/Edit Modal */}
      {expanded !== 'none' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={()=>setExpanded('none')}>
          <div className="bg-white rounded shadow-xl w-full max-w-5xl p-3 space-y-2" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium">Edit Variant {expanded}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={()=>setExpanded('none')}>Close</Button>
                <Button size="sm" onClick={()=>{ if(expanded==='A'){ setVariantA(editorHtml) } else { setVariantB(editorHtml) } setExpanded('none') }}>Save</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <textarea className="border rounded p-2 h-[70vh] text-xs" value={editorHtml} onChange={(e)=>setEditorHtml(e.target.value)} />
              <iframe className="w-full h-[70vh] border-0" srcDoc={editorHtml} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'

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
  
  // CRITICAL FIX: Prevent infinite loop with processing ref
  const processingRef = useRef(false)
  const hasGeneratedRef = useRef(false)

  useEffect(() => {
    (async () => {
      CareerFinderStorage.setProgress(5, 7)
      
      // ✅ CRITICAL FIX: Use unified storage
      const resumeData = CareerFinderStorage.getResume()
      
      if (resumeData && resumeData.extractedText && resumeData.extractedText.length > 100) {
        console.log('[OPTIMIZER] ✅ Found cached resume, length:', resumeData.extractedText.length)
        setResumeText(resumeData.extractedText)
        return
      }
      
      // FALLBACK: Fetch from database if no cache
      try {
        console.log('[OPTIMIZER] No cached resume, fetching from DB...')
        const rl = await fetch('/api/resume/list')
        if (rl.ok) {
          const rj = await rl.json()
          const txt: string = rj?.resumes?.[0]?.extractedText || ''
          if (txt.length > 100) {
            console.log('[OPTIMIZER] ✅ Found DB resume, length:', txt.length)
            setResumeText(txt)
            // Cache it using unified storage
            CareerFinderStorage.setResume(rj.resumes[0])
          } else {
            console.warn('[OPTIMIZER] ❌ No resume text found in DB')
          }
        } else {
          console.warn('[OPTIMIZER] ❌ DB fetch failed:', rl.status)
        }
      } catch (e) {
        console.error('[OPTIMIZER] ❌ Resume fetch error:', e)
      }
    })()
  }, [])

  useEffect(() => {
    CareerFinderStorage.setTemplate(template)
  }, [template])

  useEffect(() => {
    CareerFinderStorage.setTone(tone)
  }, [tone])

  const generateVariants = async () => {
    // CRITICAL FIX: Prevent multiple simultaneous calls
    if (processingRef.current) {
      console.log('[OPTIMIZER] Already processing, skipping duplicate call')
      return
    }
    
    processingRef.current = true
    setLoading(true)
    setVariantA(''); setVariantB('')
    
    try {
      console.log('[OPTIMIZER] Generating variants with template:', template)
      
      // CRITICAL FIX: Add 30-second timeout with AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      // ✅ Use unified storage for job description
      const selectedJob = CareerFinderStorage.getJob()
      const jobDescription = (selectedJob?.description || selectedJob?.summary || '').toString().slice(0, 8000)
      
      const bodyBase = { 
        resumeText: (overrideText || resumeText).slice(0, 8000), 
        template, 
        jobDescription, 
        humanize, 
        highlights 
      }
      
      const [ra, rb] = await Promise.all([
        fetch('/api/resume-builder/generate', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...bodyBase, tone }),
          signal: controller.signal
        }),
        fetch('/api/resume-builder/generate', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...bodyBase, tone: tone === 'professional' ? 'conversational' : 'professional' }),
          signal: controller.signal
        })
      ])
      
      clearTimeout(timeoutId)
      
      const ja = await ra.json().catch(()=>({}))
      const jb = await rb.json().catch(()=>({}))
      
      if (ra.ok && ja?.output?.html) {
        setVariantA(ja.output.html)
        console.log('[OPTIMIZER] Variant A generated successfully')
      }
      if (rb.ok && jb?.output?.html) {
        setVariantB(jb.output.html)
        console.log('[OPTIMIZER] Variant B generated successfully')
      }
      
      hasGeneratedRef.current = true
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[OPTIMIZER] Request timed out after 30 seconds')
      } else {
        console.error('[OPTIMIZER] Generation error:', error)
      }
    } finally {
      setLoading(false)
      processingRef.current = false
    }
  }

  // CRITICAL FIX: Only auto-generate once on initial load, not on every template change
  useEffect(() => { 
    if (resumeText && !hasGeneratedRef.current && !processingRef.current) {
      console.log('[OPTIMIZER] Auto-generating initial variants')
      generateVariants() 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeText])
  
  // Manual regeneration when user changes template
  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate)
    if (resumeText) {
      console.log('[OPTIMIZER] Template changed, regenerating variants')
      hasGeneratedRef.current = false // Allow regeneration
      setTimeout(() => generateVariants(), 100) // Small delay to ensure state is updated
    }
  }

  const saveSelection = () => {
    try {
      const html = selected === 'A' ? variantA : variantB
      if (html) localStorage.setItem('cf:selectedResumeHtml', html)
    } catch {}
  }

  return (
    <div className="mobile-container space-y-4">
      <CareerFinderBackButton />
      
      {/* No Resume Warning */}
      {!resumeText && !loading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">No Resume Found</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please upload a resume first to generate optimized variants.
              </p>
              <Link 
                href="/career-finder/resume" 
                className="text-sm text-yellow-800 dark:text-yellow-200 underline font-medium mt-2 inline-block hover:text-yellow-900"
              >
                ← Go back to upload resume
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-sm text-foreground">Choose a template, generate A/B variants by tone, and select one to continue.</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
        {TEMPLATES.map(t => (
          <button key={t.id} className={`border rounded p-2 text-left ${template===t.id?'bg-blue-50 border-blue-500':''}`} onClick={()=>handleTemplateChange(t.id)}>
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
          <div className="mb-1 text-foreground">Tone</div>
          <select className="w-full border rounded p-2 bg-background text-foreground" value={tone} onChange={(e)=>setTone(e.target.value as any)}>
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





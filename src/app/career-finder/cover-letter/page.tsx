'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

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
        // AUTOPILOT: Check cache first
        const cacheKey = 'cf:coverLetters'
        const cached = localStorage.getItem(cacheKey)
        
        if (cached) {
          console.log('[COVER_LETTER] ✅ Loading from cache')
          const letters = JSON.parse(cached)
          setLetterA(letters.variantA || '')
          setLetterB(letters.variantB || '')
          setLoading(false)
          return
        }
        
        console.log('[COVER_LETTER] 🔄 Generating new cover letters via autopilot...')
        
        // Load resume text
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
        const company = selectedJob?.company || 'Company'
        
        // Call new autopilot endpoint
        const response = await fetch('/api/cover-letter/generate-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle,
            company,
            resumeText,
            jobRequirements: [],
            companyInsights: {
              culture: '',
              values: [],
              recentNews: []
            }
          })
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          const { variantA, variantB } = result.data
          setLetterA(variantA || '')
          setLetterB(variantB || '')
          
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify(result.data))
          console.log('[COVER_LETTER] ✅ Cover letters generated and cached')
        } else {
          throw new Error(result.error || 'Failed to generate cover letters')
        }
      } catch (err) {
        console.error('[COVER_LETTER] Error:', err)
        setError('Failed to generate cover letters')
      }
      
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
    <div className="mobile-container space-y-4">
      <CareerFinderBackButton />
      <div className="text-sm text-foreground">Choose one of the generated cover letters.</div>
      {loading && <div className="text-sm">Generating letters…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`border rounded p-3 text-sm ${selected==='A'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('A')}>
            <div className="text-xs text-muted-foreground mb-2">Option A</div>
            <div className="whitespace-pre-wrap">{letterA || 'No content'}</div>
          </div>
          <div className={`border rounded p-3 text-sm ${selected==='B'?'ring-2 ring-blue-500':''}`} onClick={()=>setSelected('B')}>
            <div className="text-xs text-muted-foreground mb-2">Option B</div>
            <div className="whitespace-pre-wrap">{letterB || 'No content'}</div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Selected: {selected}</div>
        <Link className={`inline-block px-4 py-2 border rounded ${selected==='none'?'pointer-events-none opacity-50':''}`} href="/career-finder/outreach" onClick={saveSelection}>Next</Link>
      </div>
    </div>
  )
}





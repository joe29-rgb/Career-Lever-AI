'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'

const TEMPLATES = [
  { 
    id: 'modern', 
    name: 'Modern', 
    description: 'Clean, contemporary design with visual elements',
    bestFor: ['Tech', 'Startup', 'Marketing', 'Design'],
    icon: '🚀'
  },
  { 
    id: 'professional', 
    name: 'Professional', 
    description: 'Traditional, formal layout for conservative industries',
    bestFor: ['Finance', 'Legal', 'Corporate', 'Healthcare'],
    icon: '💼'
  },
  { 
    id: 'creative', 
    name: 'Creative', 
    description: 'Bold, unique design to showcase creativity',
    bestFor: ['Design', 'Marketing', 'Media', 'Arts'],
    icon: '🎨'
  },
  { 
    id: 'tech', 
    name: 'Tech-Focused', 
    description: 'Developer-friendly with project highlights',
    bestFor: ['Software Engineering', 'DevOps', 'Data Science'],
    icon: '💻'
  },
  { 
    id: 'minimal', 
    name: 'Minimal/ATS', 
    description: 'Plain text, maximum ATS compatibility',
    bestFor: ['ATS Systems', 'Large Corporations', 'Government'],
    icon: '📄'
  },
  { 
    id: 'executive', 
    name: 'Executive', 
    description: 'Leadership-focused with metrics emphasis',
    bestFor: ['C-Suite', 'Director', 'VP', 'Senior Management'],
    icon: '👔'
  },
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
  const [personalInfo, setPersonalInfo] = useState<{
    name?: string
    email?: string
    phone?: string
    location?: string
  }>({})
  const [atsScore, setAtsScore] = useState<number | null>(null)
  
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
        
        // Extract personal info from resume
        const info = extractPersonalInfo(resumeData.extractedText)
        console.log('[OPTIMIZER] 📋 Extracted personal info:', info)
        setPersonalInfo(info)
        
        // Calculate ATS score
        const score = calculateATSScore(resumeData.extractedText)
        console.log('[OPTIMIZER] 📊 ATS Score:', score)
        setAtsScore(score)
        
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

  const handleRegenerate = async () => {
    // Clear cache to force new generation
    localStorage.removeItem('cf:resumeVariants')
    console.log('[OPTIMIZER] 🔄 Cache cleared, regenerating variants...')
    await generateVariants()
  }

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
      // AUTOPILOT: Check cache first
      const cacheKey = 'cf:resumeVariants'
      const cached = localStorage.getItem(cacheKey)
      
      if (cached && !overrideText) {
        console.log('[OPTIMIZER] ✅ Loading variants from cache')
        const variants = JSON.parse(cached)
        setVariantA(variants.variantA || '')
        setVariantB(variants.variantB || '')
        hasGeneratedRef.current = true
        setLoading(false)
        processingRef.current = false
        return
      }
      
      console.log('[OPTIMIZER] 🔄 Generating new variants via autopilot...')
      
      // Get job data
      const selectedJob = CareerFinderStorage.getJob()
      const jobTitle = selectedJob?.title || 'Professional'
      const jobRequirements = selectedJob?.skills || []
      
      // Call new autopilot endpoint
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: (overrideText || resumeText).slice(0, 8000),
          jobTitle,
          jobRequirements,
          companyInsights: {
            culture: '',
            values: [],
            industry: ''
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const { variantA: vA, variantB: vB } = result.data
        setVariantA(vA || '')
        setVariantB(vB || '')
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify(result.data))
        console.log('[OPTIMIZER] ✅ Variants generated and cached')
        
        hasGeneratedRef.current = true
      } else {
        throw new Error(result.error || 'Failed to generate variants')
      }
      
    } catch (error) {
      console.error('[OPTIMIZER] Generation error:', error)
      const errorMsg = `<div style="padding:20px;text-align:center;color:#ef4444;">❌ Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}</div>`
      setVariantA(errorMsg)
      setVariantB(errorMsg)
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
  
  // Extract personal information from resume text
  const extractPersonalInfo = (text: string) => {
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
    const phoneMatch = text.match(/(\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/i)
    
    // Extract location (city, state/province format)
    const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/i)
    
    // Extract name (assume first line or first capitalized words before contact info)
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let name = ''
    for (const line of lines.slice(0, 5)) {
      if (line.length > 5 && line.length < 50 && !line.includes('@') && !line.match(/\d{3}/) && /^[A-Z]/.test(line)) {
        name = line
        break
      }
    }
    
    return {
      name,
      email: emailMatch?.[1],
      phone: phoneMatch?.[1],
      location: locationMatch ? `${locationMatch[1]}, ${locationMatch[2]}` : undefined
    }
  }
  
  // Calculate ATS compatibility score (0-100)
  const calculateATSScore = (text: string): number => {
    let score = 60 // Base score
    
    // Check for contact info
    if (text.match(/@/)) score += 5
    if (text.match(/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/)) score += 5
    if (text.match(/[A-Z][a-z]+,\s*[A-Z]{2}/)) score += 5
    
    // Check for standard sections
    if (text.match(/experience|employment/i)) score += 5
    if (text.match(/education/i)) score += 5
    if (text.match(/skills/i)) score += 5
    
    // Check for keywords and quantifiable achievements
    const keywords = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || []
    if (keywords.length > 30) score += 5
    
    // Check for numbers/metrics (good for ATS)
    const numbers = text.match(/\d+%|\$\d+|increased|decreased|improved/gi) || []
    if (numbers.length > 3) score += 5
    
    return Math.min(score, 100)
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <CareerFinderBackButton />
      
      {/* Personal Info Header with ATS Score */}
      {resumeText && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{personalInfo.name || 'Resume Optimizer'}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                {personalInfo.email && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{personalInfo.location}</span>
                  </div>
                )}
              </div>
            </div>
            {atsScore !== null && (
              <div className="text-right">
                <div className="text-5xl font-bold text-primary">{atsScore}%</div>
                <div className="text-sm text-muted-foreground mt-1">ATS Score</div>
                <div className={`text-xs font-semibold mt-1 ${atsScore >= 80 ? 'text-green-500' : atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {atsScore >= 80 ? '✓ ATS-Optimized' : atsScore >= 60 ? '⚠ Needs Improvement' : '✗ Low Compatibility'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* No Resume Warning */}
      {!resumeText && !loading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
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
      
      {/* Template Selection */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Choose Resume Template</h2>
        <p className="text-sm text-muted-foreground mb-4">Select a template style that matches your industry and experience level</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button 
              key={t.id} 
              className={`border border-border rounded-lg p-4 text-left hover:shadow-lg transition-all ${template===t.id?'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500':''}`} 
              onClick={()=>handleTemplateChange(t.id)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{t.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground text-lg mb-1">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
                {template === t.id && (
                  <div className="text-blue-500 text-xl">✓</div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {t.bestFor.map((industry) => (
                  <span key={industry} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {industry}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
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
      {/* Resume Variants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div 
          className={`bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selected==='A'?'ring-2 ring-blue-500 shadow-xl':''}`} 
          onClick={()=>setSelected('A')}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div>
              <h3 className="font-bold text-foreground">Variant A</h3>
              <p className="text-xs text-muted-foreground">Professional Tone</p>
            </div>
            <div className="flex items-center gap-2">
              {selected === 'A' && (
                <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">Selected</span>
              )}
              <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setEditorHtml(variantA); setExpanded('A') }}>Edit</Button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900">
            <iframe className="w-full h-96 border-0" srcDoc={variantA || '<div class="p-6 text-center text-muted-foreground">Generating variant...</div>'} />
          </div>
        </div>
        
        <div 
          className={`bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selected==='B'?'ring-2 ring-blue-500 shadow-xl':''}`} 
          onClick={()=>setSelected('B')}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div>
              <h3 className="font-bold text-foreground">Variant B</h3>
              <p className="text-xs text-muted-foreground">Alternative Tone</p>
            </div>
            <div className="flex items-center gap-2">
              {selected === 'B' && (
                <span className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full font-semibold">Selected</span>
              )}
              <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setEditorHtml(variantB); setExpanded('B') }}>Edit</Button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900">
            <iframe className="w-full h-96 border-0" srcDoc={variantB || '<div class="p-6 text-center text-muted-foreground">Generating variant...</div>'} />
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <Button variant="outline" onClick={handleRegenerate} disabled={loading} className="px-6">
          {loading ? 'Generating...' : 'Regenerate Variants'}
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {selected === 'none' ? 'Select a variant to continue' : `Variant ${selected} selected`}
          </div>
          <Link 
            className={`px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl ${selected==='none'?'pointer-events-none opacity-50 cursor-not-allowed':''}`}
            href="/career-finder/cover-letter" 
            onClick={saveSelection}
          >
            Continue to Cover Letter →
          </Link>
        </div>
      </div>

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





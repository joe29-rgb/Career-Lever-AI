'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'
import { ResumeSkeleton } from '@/components/skeleton-loader'

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
        
        // Don't calculate ATS score yet - wait for optimized resume
        console.log('[OPTIMIZER] ⏳ ATS Score will be calculated after optimization')
        setAtsScore(null)
        
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

  // Calculate real ATS score using API that compares against job requirements
  const calculateRealATSScore = async (resumeText: string) => {
    try {
      const jobAnalysis = CareerFinderStorage.getJobAnalysis()
      if (!jobAnalysis) {
        console.warn('[OPTIMIZER] ⚠️ No job analysis found, using basic ATS score')
        setAtsScore(75) // Default score if no job analysis
        return
      }
      
      console.log('[OPTIMIZER] 📊 Calculating ATS score against job requirements...')
      const response = await fetch('/api/insights/ats/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobAnalysis
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.ats) {
          console.log('[OPTIMIZER] ✅ ATS Score:', result.ats.score)
          console.log('[OPTIMIZER] 📊 Matched Keywords:', result.ats.matchedKeywords.length)
          console.log('[OPTIMIZER] ⚠️ Missing Keywords:', result.ats.missingKeywords.length)
          setAtsScore(result.ats.score)
        }
      } else {
        console.warn('[OPTIMIZER] ⚠️ ATS API failed, using fallback score')
        setAtsScore(75)
      }
    } catch (error) {
      console.error('[OPTIMIZER] ❌ ATS calculation error:', error)
      setAtsScore(75)
    }
  }

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
          },
          template: template
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        const { variantA: vA, variantB: vB } = result.data
        
        // Format plain text as HTML with proper styling
        const formattedA = formatResumeAsHTML(vA || '', personalInfo)
        const formattedB = formatResumeAsHTML(vB || '', personalInfo)
        
        setVariantA(formattedA)
        setVariantB(formattedB)
        
        // Calculate ATS score on optimized resume using real API
        await calculateRealATSScore(vA || '')
        
        // Cache the formatted result
        localStorage.setItem(cacheKey, JSON.stringify({ variantA: formattedA, variantB: formattedB }))
        console.log('[OPTIMIZER] ✅ Variants generated, formatted, and cached')
        
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
      // CRITICAL: Clear cache BEFORE regeneration
      localStorage.removeItem('cf:resumeVariants')
      console.log('[OPTIMIZER] 🔄 Cache cleared, regenerating variants...')
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
  
  // Convert plain text resume to HTML with proper formatting
  const formatResumeAsHTML = (text: string, personalInfo: { name?: string; email?: string; phone?: string; location?: string }): string => {
    if (!text) return ''
    
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let html = '<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 800px; padding: 20px;">'
    
    // Check if header info already exists in first 200 chars
    const first200 = text.substring(0, 200).toLowerCase()
    const hasNameInText = personalInfo.name && first200.includes(personalInfo.name.toLowerCase())
    const hasEmailInText = personalInfo.email && first200.includes(personalInfo.email.toLowerCase())
    const hasPhoneInText = personalInfo.phone && first200.includes(personalInfo.phone.replace(/[\s.-]/g, ''))
    
    // Only add header if NOT already in resume text
    if (!hasNameInText && personalInfo.name) {
      html += `<h1 style="font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #1a1a1a;">${personalInfo.name}</h1>`
    }
    
    // Only add contact info if NOT already in resume text
    if (!hasEmailInText && !hasPhoneInText) {
      const contactParts: string[] = []
      if (personalInfo.location) contactParts.push(personalInfo.location)
      if (personalInfo.phone) contactParts.push(personalInfo.phone)
      if (personalInfo.email) contactParts.push(personalInfo.email)
      
      if (contactParts.length > 0) {
        html += `<div style="font-size: 14px; color: #666; margin-bottom: 24px;">${contactParts.join(' | ')}</div>`
      }
    }
    
    // Track if we've seen contact info to skip duplicates
    const seenContactInfo = new Set<string>()
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip ALL personal info lines - they're already in the header or AI-generated
      let shouldSkip = false
      
      if (personalInfo.name && line.toLowerCase().includes(personalInfo.name.toLowerCase())) {
        if (!seenContactInfo.has('name')) {
          seenContactInfo.add('name')
          // Skip if we added header OR if it's in AI-generated text
          if (!hasNameInText || hasNameInText) shouldSkip = true
        } else {
          shouldSkip = true // Skip all subsequent occurrences
        }
      }
      
      if (personalInfo.email && line.includes(personalInfo.email)) {
        if (!seenContactInfo.has('email')) {
          seenContactInfo.add('email')
          shouldSkip = true
        } else {
          shouldSkip = true
        }
      }
      
      if (personalInfo.phone && line.includes(personalInfo.phone.replace(/[\s.-]/g, ''))) {
        if (!seenContactInfo.has('phone')) {
          seenContactInfo.add('phone')
          shouldSkip = true
        } else {
          shouldSkip = true
        }
      }
      
      if (personalInfo.location && line.includes(personalInfo.location)) {
        if (!seenContactInfo.has('location')) {
          seenContactInfo.add('location')
        }
        shouldSkip = true // Always skip location lines
      }
      
      if (shouldSkip) continue
      
      // Section headers (all caps)
      if (line.match(/^[A-Z\s]{3,}$/) && line.length < 50) {
        html += `<h2 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; color: #1a1a1a;">${line}</h2>`
      }
      // Bullet points - consistent spacing
      else if (line.startsWith('•') || line.startsWith('-')) {
        html += `<div style="margin-left: 24px; margin-bottom: 4px; line-height: 1.6;">${line}</div>`
      }
      // Job titles / positions (bold if followed by company)
      else if (i < lines.length - 1 && lines[i + 1].includes('|')) {
        html += `<div style="font-weight: bold; font-size: 16px; margin-top: 16px; margin-bottom: 4px;">${line}</div>`
      }
      // Company/location/dates line
      else if (line.includes('|')) {
        html += `<div style="font-style: italic; color: #666; font-size: 14px; margin-bottom: 8px;">${line}</div>`
      }
      // Regular paragraph
      else {
        html += `<p style="margin-bottom: 8px; line-height: 1.6;">${line}</p>`
      }
    }
    
    html += '</div>'
    return html
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
      <CareerFinderBackButton />
      
      {/* Personal Info Header with ATS Score - Dribbble Inspired */}
      {resumeText && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl backdrop-blur-sm">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">{personalInfo.name || 'Resume Optimizer'}</h1>
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
                <div className="relative inline-block">
                  {/* Circular progress ring */}
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - atsScore / 100)}`} className={`transition-all duration-1000 ${atsScore >= 80 ? 'text-green-500' : atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">{atsScore}%</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">ATS Score</div>
                <div className={`text-xs font-bold mt-1 px-3 py-1 rounded-full inline-block ${atsScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : atsScore >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {atsScore >= 80 ? '✓ Optimized' : atsScore >= 60 ? '⚠ Fair' : '✗ Low'}
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
      
      {/* Template Selection - Modern Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl">🎨</div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Choose Resume Template</h2>
            <p className="text-xs text-muted-foreground">Select a style that matches your industry</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button 
              key={t.id} 
              className={`group relative border rounded-xl p-5 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${template===t.id?'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-500 shadow-lg shadow-blue-500/20':'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800/50'}`} 
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
            {loading && !variantA ? (
              <div className="p-6">
                <ResumeSkeleton />
              </div>
            ) : (
              <iframe className="w-full h-96 border-0" srcDoc={variantA || '<div class="p-6 text-center text-muted-foreground">Generating variant...</div>'} />
            )}
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
            {loading && !variantB ? (
              <div className="p-6">
                <ResumeSkeleton />
              </div>
            ) : (
              <iframe className="w-full h-96 border-0" srcDoc={variantB || '<div class="p-6 text-center text-muted-foreground">Generating variant...</div>'} />
            )}
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





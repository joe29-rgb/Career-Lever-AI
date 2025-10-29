'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'
import { ResumeSkeleton } from '@/components/skeleton-loader'
import { getTemplateById } from '@/lib/resume-templates-v2'
import { parseResumeText } from '@/lib/resume-parser'

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
  { 
    id: 'cv', 
    name: 'Curriculum Vitae', 
    description: 'Academic format for research and scholarly positions',
    bestFor: ['Academic', 'Research', 'PhD', 'Professor'],
    icon: '🎓'
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
        
        // Extract personal info from resume text
        let info = extractPersonalInfo(resumeData.extractedText)
        
        // CRITICAL FIX: Fallback to UserProfile if extraction failed
        if (!info.name || !info.email) {
          try {
            const profileRes = await fetch('/api/profile')
            if (profileRes.ok) {
              const profileData = await profileRes.json()
              if (profileData.profile) {
                console.log('[OPTIMIZER] 📋 Using UserProfile data for missing fields')
                info = {
                  name: info.name || `${profileData.profile.firstName} ${profileData.profile.lastName}`,
                  email: info.email || profileData.profile.email,
                  phone: info.phone || profileData.profile.phone,
                  location: info.location || (profileData.profile.location ? 
                    `${profileData.profile.location.city}, ${profileData.profile.location.province}` : undefined)
                }
              }
            }
          } catch (error) {
            console.log('[OPTIMIZER] Could not fetch UserProfile, using extracted info only')
          }
        }
        
        console.log('[OPTIMIZER] 📋 Final personal info:', info)
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
        
        // Format plain text as HTML with selected template
        const formattedA = formatResumeWithTemplate(vA || '', personalInfo, template)
        const formattedB = formatResumeWithTemplate(vB || '', personalInfo, template)
        
        // Set variants directly - formatResumeWithTemplate already handles escaping correctly
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
  
  // Template to tone mapping
  const templateToToneMap: Record<string, 'professional' | 'conversational' | 'technical'> = {
    'modern': 'professional',
    'professional': 'professional',
    'creative': 'conversational',
    'minimal': 'professional',
    'executive': 'professional',
    'technical': 'technical'
  }

  // Manual regeneration when user changes template
  const handleTemplateChange = (newTemplate: string) => {
    console.log('[OPTIMIZER] 🎨 Template changed to:', newTemplate)
    
    // CRITICAL FIX: Clear variants immediately to show loading state
    setVariantA('')
    setVariantB('')
    setLoading(true)
    
    setTemplate(newTemplate)
    
    // Auto-select matching tone
    const matchingTone = templateToToneMap[newTemplate] || 'professional'
    setTone(matchingTone)
    console.log('[OPTIMIZER] Auto-selected tone:', matchingTone)
    
    if (resumeText) {
      console.log('[OPTIMIZER] Regenerating variants with new template and tone')
      // CRITICAL: Clear cache BEFORE regeneration
      localStorage.removeItem('cf:resumeVariants')
      hasGeneratedRef.current = false // Allow regeneration
      processingRef.current = false // Reset processing flag
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        generateVariants()
      }, 150)
    } else {
      setLoading(false)
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
    // Email extraction - multiple patterns
    const emailMatch = text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i)
    
    // Phone extraction - North American formats
    const phoneMatch = text.match(/(\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/i)
    
    // Location extraction - City, Province/State format
    const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2,})/i)
    
    // Name extraction - improved logic
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let name = ''
    
    // Strategy 1: Look for name before email/phone (usually first 3 lines)
    for (const line of lines.slice(0, 3)) {
      // Skip if line contains email, phone, or common resume headers
      if (line.includes('@') || 
          line.match(/\d{3}/) || 
          /^(resume|curriculum|vitae|cv|profile|summary|objective|experience|education|skills)/i.test(line)) {
        continue
      }
      
      // Check if line looks like a name (2-4 words, proper case, reasonable length)
      const words = line.split(/\s+/)
      if (words.length >= 2 && 
          words.length <= 4 && 
          line.length >= 5 && 
          line.length <= 50 &&
          /^[A-Z]/.test(line) &&
          words.every(w => /^[A-Z][a-z]+/.test(w) || w.length <= 3)) {
        name = line
        break
      }
    }
    
    // Strategy 2: If no name found, look for "Name:" or similar labels
    if (!name) {
      const nameMatch = text.match(/(?:Name|Full Name|Candidate):\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})/i)
      if (nameMatch) {
        name = nameMatch[1]
      }
    }
    
    // Strategy 3: Try to extract from structured format (e.g., "John Doe | email@example.com")
    if (!name) {
      const structuredMatch = text.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[|\-•]/m)
      if (structuredMatch) {
        name = structuredMatch[1]
      }
    }
    
    return {
      name: name || undefined,
      email: emailMatch?.[1],
      phone: phoneMatch?.[1],
      location: locationMatch ? `${locationMatch[1]}, ${locationMatch[2]}` : undefined
    }
  }
  
  // ENTERPRISE: Format resume using professional templates V2
  const formatResumeWithTemplate = (text: string, personalInfo: { name?: string; email?: string; phone?: string; location?: string }, templateId: string): string => {
    if (!text) return '<div style="padding: 40px; text-align: center; color: #666;">No resume content available</div>'
    
    // Parse plain text into structured data
    const resumeData = parseResumeText(text, personalInfo)
    
    // Get template and generate HTML
    const template = getTemplateById(templateId)
    const htmlContent = template.generate(resumeData)
    
    // Wrap in full HTML document with template CSS
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${resumeData.personalInfo.fullName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    ${template.css}
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`
    
    return html
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
      <CareerFinderBackButton />
      
      {/* ATS Score Display - No Personal Info Duplication */}
      {atsScore !== null && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Resume Optimization</h2>
              <p className="text-sm text-muted-foreground">Choose your preferred variant below</p>
            </div>
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                  <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 52}`} strokeDashoffset={`${2 * Math.PI * 52 * (1 - atsScore / 100)}`} className={`transition-all duration-1000 ${atsScore >= 80 ? 'text-green-500' : atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">{atsScore}%</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2 font-medium">ATS Score</div>
              <div className={`text-xs font-bold mt-1 px-3 py-1 rounded-full inline-block ${atsScore >= 80 ? 'bg-green-100 text-green-700' : atsScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {atsScore >= 80 ? '✓ Optimized' : atsScore >= 60 ? '⚠ Fair' : '✗ Low'}
              </div>
            </div>
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
      <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-2xl p-6 mb-6 shadow-lg dark:bg-background">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">🎨</div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Choose Resume Template</h2>
            <p className="text-xs text-muted-foreground">Select a style that matches your industry</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button 
              key={t.id} 
              className={`group relative border rounded-xl p-5 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl ${template===t.id?'bg-gradient-to-br from-blue-950/50 to-purple-950/50 border-blue-500 shadow-lg shadow-blue-500/20':'border-border hover:border-blue-700 bg-card'}`} 
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
                  <span key={industry} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded-full">
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
          <textarea className="w-full border border-border rounded p-2 h-24 bg-background text-foreground" placeholder="Paste to override uploaded resume text for this optimization only" value={overrideText} onChange={(e)=>setOverrideText(e.target.value)} />
        </div>
        <div>
          <div className="mb-1 text-foreground">Tone <span className="text-xs text-muted-foreground">(auto-selected based on template)</span></div>
          <select className="w-full border rounded p-2 bg-background text-foreground" value={tone} onChange={(e)=>setTone(e.target.value as 'professional' | 'conversational' | 'technical')}>
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
                <span className="px-3 py-1 bg-blue-500 text-xs rounded-full font-semibold">Selected</span>
              )}
              <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setEditorHtml(variantA); setExpanded('A') }}>Edit</Button>
            </div>
          </div>
          <div className="bg-card">
            {loading && !variantA ? (
              <div className="p-6">
                <ResumeSkeleton />
              </div>
            ) : (
              <iframe 
                key={`variant-a-${template}`}
                className="w-full h-96 border-0" 
                srcDoc={variantA || '<div style="padding: 24px; text-align: center; color: #666;">Generating variant...</div>'}
                sandbox="allow-same-origin allow-scripts"
                title="Resume Variant A"
              />
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
                <span className="px-3 py-1 bg-purple-500 text-xs rounded-full font-semibold">Selected</span>
              )}
              <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setEditorHtml(variantB); setExpanded('B') }}>Edit</Button>
            </div>
          </div>
          <div className="bg-card">
            {loading && !variantB ? (
              <div className="p-6">
                <ResumeSkeleton />
              </div>
            ) : (
              <iframe 
                key={`variant-b-${template}`}
                className="w-full h-96 border-0" 
                srcDoc={variantB || '<div style="padding: 24px; text-align: center; color: #666;">Generating variant...</div>'}
                sandbox="allow-same-origin allow-scripts"
                title="Resume Variant B"
              />
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
            className={`px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl ${selected==='none'?'pointer-events-none opacity-50 cursor-not-allowed':''}`}
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
          <div className="bg-card rounded shadow-xl w-full max-w-5xl p-3 space-y-2" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium">Edit Variant {expanded}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={()=>setExpanded('none')}>Close</Button>
                <Button size="sm" onClick={()=>{ if(expanded==='A'){ setVariantA(editorHtml) } else { setVariantB(editorHtml) } setExpanded('none') }}>Save</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <textarea className="border rounded p-2 h-[70vh] text-xs" value={editorHtml} onChange={(e)=>setEditorHtml(e.target.value)} />
              <iframe className="w-full h-[70vh] border-0" srcDoc={editorHtml} sandbox="allow-same-origin allow-scripts" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





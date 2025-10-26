'use client'

export const dynamic = 'force-dynamic'

import { ResumeUpload } from '@/components/resume-upload'
import { useEffect, useState } from 'react'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import { formatResumeWithLineBreaks } from '@/lib/text-formatting'
import { AutopilotProgressTracker } from '@/components/autopilot-progress-tracker'
import toast from 'react-hot-toast'

interface Resume {
  _id: string
  extractedText: string
  originalFileName?: string
}

interface ComprehensiveAnalysis {
  aiRisk?: {
    aiReplacementRisk: string
    reasoning: string
    careerOutlook: string
    fiveYearOutlook?: string
    recommendations?: string[]
  }
  salaryIntelligence?: {
    targetRange?: {
      min?: number
      max?: number
    }
    marketData?: {
      percentile50?: number
    }
  }
  careerPath?: {
    currentLevel?: string
    nextPossibleRoles?: string[]
  }
  [key: string]: unknown
}

export default function CareerFinderResumePage() {
  const [existingResume, setExistingResume] = useState<Resume | null>(null)
  const [loadingExisting, setLoadingExisting] = useState<boolean>(true)
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<ComprehensiveAnalysis | null>(null)
  const [analyzingResume, setAnalyzingResume] = useState<boolean>(false)
  
  // COMPETITIVE ADVANTAGE: Comprehensive resume analysis with AI risk
  const handleComprehensiveAnalysis = async (resumeText: string) => {
    if (!resumeText || resumeText.length < 100) {
      console.warn('[COMPREHENSIVE_ANALYSIS] Resume text too short:', resumeText.length)
      return
    }

    setAnalyzingResume(true)
    console.log('[COMPREHENSIVE_ANALYSIS] Starting analysis, text length:', resumeText.length)

    try {
      const response = await fetch('/api/resume/analyze-comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeText, 
          options: { 
            includeAiRisk: true,
            includeMarketData: true,
            includeCareerPath: true
          } 
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[COMPREHENSIVE_ANALYSIS] Success:', data)
        setComprehensiveAnalysis(data.analysis)
        
        // Cache the analysis
        try {
          localStorage.setItem('cf:comprehensiveAnalysis', JSON.stringify(data.analysis))
        } catch (e) {
          console.warn('[COMPREHENSIVE_ANALYSIS] Failed to cache:', e)
        }
      } else {
        const error = await response.json()
        console.error('[COMPREHENSIVE_ANALYSIS] API error:', error)
      }
    } catch (error) {
      console.error('[COMPREHENSIVE_ANALYSIS] Request failed:', error)
    } finally {
      setAnalyzingResume(false)
    }
  }

  // ENTERPRISE FIX: Auto-load existing resume from localStorage or DB
  useEffect(() => {
    (async () => {
      try { localStorage.setItem('cf:progress', JSON.stringify({ step: 1, total: 7 })) } catch {}
      
      // Step 1: Check localStorage for cached resume
      try {
        const cachedResume = localStorage.getItem('cf:resume')
        if (cachedResume) {
          const parsed = JSON.parse(cachedResume)
          console.log('[RESUME_PAGE] Found cached resume in localStorage:', parsed?._id || parsed?.originalFileName)
          setExistingResume(parsed)
          setLoadingExisting(false)
          return // Early return if we have a cached resume
        }
      } catch (e) {
        console.warn('[RESUME_PAGE] Failed to load cached resume from localStorage:', e)
      }

      // Step 2: Fetch from API if no cache
      try {
        const r = await fetch('/api/resume/list')
        if (r.ok) {
          const j = await r.json()
          if (Array.isArray(j.resumes) && j.resumes.length > 0) {
            const mostRecent = j.resumes[0]
            console.log('[RESUME_PAGE] Found DB resume:', mostRecent._id)
            setExistingResume(mostRecent)
            
            // Cache it for future use
            try {
              localStorage.setItem('cf:resume', JSON.stringify(mostRecent))
              localStorage.setItem('cf:autopilotReady', '1')
              console.log('[RESUME_PAGE] Resume cached, autopilot will trigger on Continue button')
            } catch (cacheError) {
              console.warn('[RESUME_PAGE] Failed to cache resume:', cacheError)
            }
          }
        }
      } catch (e) {
        console.warn('[RESUME_PAGE] Failed to fetch resumes from API:', e)
      }
      
      setLoadingExisting(false)
    })()
  }, [])
  
  return (
    <div className="min-h-screen bg-background">
      {/* PHASE 1: Autopilot Progress Tracker */}
      <AutopilotProgressTracker />
      
      {/* Modern Header */}
      <div className="gradient-hero p-8 rounded-b-3xl shadow-2xl mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <CareerFinderBackButton />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-center mb-3">📄 Resume Manager</h1>
          <p className="text-foreground/90 text-center text-lg">Upload or build your resume to get started!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* ENTERPRISE FIX: Show existing resume if available */}
        {loadingExisting && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-foreground">Loading your resume...</p>
          </div>
        )}

        {!loadingExisting && existingResume && (
          <div className="gradient-border-card mb-8 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Resume Loaded</h3>
                <p className="text-sm text-muted-foreground">
                  {existingResume.originalFileName || 'Your Resume'} • {existingResume.extractedText?.length || 0} chars
                </p>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-4 max-h-[200px] overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {formatResumeWithLineBreaks(existingResume.extractedText || '').slice(0, 500)}
                {existingResume.extractedText?.length > 500 && '...'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!existingResume?._id) return
                  
                  try {
                    console.log('[AUTOPILOT] 🚀 Continue button clicked - triggering autopilot...')
                    
                    // Trigger autopilot
                    const autopilotResponse = await fetch('/api/career-finder/autopilot', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        resumeId: existingResume._id
                      })
                    })
                    
                    if (autopilotResponse.ok) {
                      const autopilotData = await autopilotResponse.json()
                      console.log('[AUTOPILOT] ✅ Success:', autopilotData)
                      
                      // Cache signals
                      if (autopilotData.signals) {
                        localStorage.setItem('cf:signals', JSON.stringify(autopilotData.signals))
                        
                        // Cache keywords and location separately
                        if (autopilotData.signals.keywords?.length > 0) {
                          const topKeywords = autopilotData.signals.keywords.slice(0, 30).join(', ')
                          localStorage.setItem('cf:keywords', topKeywords)
                          console.log('[AUTOPILOT] ✅ Keywords:', topKeywords)
                        }
                        
                        if (autopilotData.signals.location) {
                          localStorage.setItem('cf:location', autopilotData.signals.location)
                          console.log('[AUTOPILOT] ✅ Location:', autopilotData.signals.location)
                        }
                        
                        // CRITICAL: Set autopilot ready flag so search page knows to auto-search
                        localStorage.setItem('cf:autopilotReady', '1')
                        console.log('[AUTOPILOT] ✅ Set autopilotReady flag')
                      }
                    } else {
                      console.error('[AUTOPILOT] ❌ Failed:', await autopilotResponse.text())
                    }
                  } catch (error) {
                    console.error('[AUTOPILOT] ❌ Error:', error)
                  }
                  
                  // Navigate to search regardless of autopilot success (fallback)
                  window.location.href = '/career-finder/search'
                }}
                className="flex-1 btn-gradient text-center py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                🚀 Continue with this Resume
              </button>
              <button 
                onClick={() => {
                  if (existingResume?.extractedText) {
                    handleComprehensiveAnalysis(existingResume.extractedText)
                  }
                }}
                disabled={analyzingResume}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzingResume ? '🔄 Analyzing...' : '🔍 AI Analysis'}
              </button>
              <button 
                onClick={() => {
                  setExistingResume(null)
                  setComprehensiveAnalysis(null)
                  try {
                    // Clear all autopilot cache
                    localStorage.removeItem('cf:resume')
                    localStorage.removeItem('cf:autopilotReady')
                    localStorage.removeItem('cf:comprehensiveAnalysis')
                    localStorage.removeItem('cf:signals')
                    localStorage.removeItem('cf:resumeVariants')
                    localStorage.removeItem('cf:coverLetters')
                    localStorage.removeItem('cf:emailOutreach')
                    console.log('[CACHE] All autopilot cache cleared')
                  } catch {}
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Upload New
              </button>
            </div>
          </div>
        )}

        {/* COMPETITIVE ADVANTAGE: Display comprehensive analysis results */}
        {comprehensiveAnalysis && (
          <div className="gradient-border-card mb-8 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text">AI-Powered Resume Analysis</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* AI Risk Analysis */}
              {comprehensiveAnalysis.aiRisk && (
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚠️</span>
                    <h4 className="text-lg font-bold text-foreground">AI/Automation Risk</h4>
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    <span className={`${
                      comprehensiveAnalysis.aiRisk.aiReplacementRisk === 'low' ? 'text-green-500' :
                      comprehensiveAnalysis.aiRisk.aiReplacementRisk === 'medium' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {comprehensiveAnalysis.aiRisk.aiReplacementRisk?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comprehensiveAnalysis.aiRisk.reasoning?.slice(0, 100)}...</p>
                </div>
              )}

              {/* Career Outlook */}
              {comprehensiveAnalysis.aiRisk && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📈</span>
                    <h4 className="text-lg font-bold text-foreground">5-Year Outlook</h4>
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    <span className={`${
                      comprehensiveAnalysis.aiRisk.fiveYearOutlook === 'thriving' ? 'text-green-500' :
                      comprehensiveAnalysis.aiRisk.fiveYearOutlook === 'growing' ? 'text-blue-500' :
                      comprehensiveAnalysis.aiRisk.fiveYearOutlook === 'stable' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {comprehensiveAnalysis.aiRisk.fiveYearOutlook?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Career trajectory projection based on market trends</p>
                </div>
              )}
            </div>

            {/* Salary Intelligence */}
            {comprehensiveAnalysis.salaryIntelligence && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💰</span>
                  <h4 className="text-lg font-bold text-foreground">Market Salary Intelligence</h4>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Target Range</p>
                    <p className="text-2xl font-bold text-green-500">
                      ${comprehensiveAnalysis.salaryIntelligence.targetRange?.min?.toLocaleString()} - 
                      ${comprehensiveAnalysis.salaryIntelligence.targetRange?.max?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Median (P50)</p>
                    <p className="text-xl font-bold text-foreground">
                      ${comprehensiveAnalysis.salaryIntelligence.marketData?.percentile50?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Career Path Intelligence */}
            {comprehensiveAnalysis.careerPath && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h4 className="text-lg font-bold text-foreground">Career Path Intelligence</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Level</p>
                    <p className="text-lg font-semibold text-foreground">{comprehensiveAnalysis.careerPath.currentLevel}</p>
                  </div>
                  {(comprehensiveAnalysis.careerPath.nextPossibleRoles?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Next Possible Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {comprehensiveAnalysis.careerPath.nextPossibleRoles?.slice(0, 3).map((role: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            {(comprehensiveAnalysis.aiRisk?.recommendations?.length ?? 0) > 0 && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-6 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💡</span>
                  <h4 className="text-lg font-bold text-foreground">AI Recommendations</h4>
                </div>
                <ul className="space-y-2">
                  {comprehensiveAnalysis.aiRisk?.recommendations?.slice(0, 3).map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span className="text-sm text-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loadingExisting && !existingResume && (
          <div className="gradient-border-card hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text">Resume Upload</h3>
            </div>
            <ResumeUpload 
              onUploadSuccess={async (resume) => {
                try {
                  console.log('[AUTOPILOT] Resume uploaded, triggering autopilot...', resume._id)
                  
                  // Clear old autopilot cache before generating new data
                  localStorage.removeItem('cf:signals')
                  localStorage.removeItem('cf:resumeVariants')
                  localStorage.removeItem('cf:coverLetters')
                  localStorage.removeItem('cf:emailOutreach')
                  localStorage.removeItem('cf:comprehensiveAnalysis')
                  console.log('[CACHE] Old autopilot cache cleared')
                  
                  // Trigger autopilot to pre-compute AI data
                  const autopilotResponse = await fetch('/api/career-finder/autopilot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      resumeId: resume._id
                    })
                  })
                  
                  if (autopilotResponse.ok) {
                    const autopilotData = await autopilotResponse.json()
                    console.log('[AUTOPILOT] Success:', autopilotData)
                    
                    // Cache signals in localStorage for instant access
                    if (autopilotData.signals) {
                      localStorage.setItem('cf:signals', JSON.stringify(autopilotData.signals))
                      
                      // CRITICAL: Cache keywords and location separately for search page
                      if (autopilotData.signals.keywords?.length > 0) {
                        const topKeywords = autopilotData.signals.keywords.slice(0, 30).join(', ')
                        localStorage.setItem('cf:keywords', topKeywords)
                        console.log('[AUTOPILOT] ✅ Keywords:', topKeywords)
                      }
                      
                      if (autopilotData.signals.location) {
                        localStorage.setItem('cf:location', autopilotData.signals.location)
                        console.log('[AUTOPILOT] ✅ Location:', autopilotData.signals.location)
                      }
                      
                      // CRITICAL: Set autopilot ready flag AFTER successful extraction
                      localStorage.setItem('cf:autopilotReady', '1')
                      console.log('[AUTOPILOT] ✅ Set autopilotReady flag')
                    }
                    
                    toast.success('✅ Resume uploaded! Autopilot is preparing your data...', {
                      duration: 3000
                    })
                  } else {
                    console.warn('[AUTOPILOT] Failed:', await autopilotResponse.text())
                    toast.error('⚠️ Resume uploaded, but autopilot failed. You can still proceed manually.', {
                      duration: 4000
                    })
                  }
                  
                  // Trigger re-fetch
                  setTimeout(() => window.location.reload(), 1000)
                } catch (error) {
                  console.error('[AUTOPILOT] Error:', error)
                  toast.error('⚠️ Resume uploaded, but autopilot encountered an error.', {
                    duration: 4000
                  })
                  // Still reload even if autopilot fails
                  setTimeout(() => window.location.reload(), 1000)
                }
              }} 
              onUploadError={() => {}}
            />
          </div>
        )}

      </div>
    </div>
  )
}


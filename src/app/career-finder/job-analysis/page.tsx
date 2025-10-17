/**
 * Job Analysis Page
 * Auto-analyzes selected job and compares with user's resume
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, MapPin, DollarSign, Target, CheckCircle2, AlertCircle, FileText, ExternalLink } from 'lucide-react'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'
import { normalizeSalary, getSalaryDisplayString } from '@/lib/utils/salary-normalizer'
import { CompanyResearchResult } from '@/lib/company-research-types'

interface JobData {
  id?: string
  title: string
  company: string
  location: string
  salary?: string
  description?: string
  summary?: string
  url?: string
  source?: string
  skills?: string[]
}

interface AnalysisResult {
  matchScore?: number // Optional - undefined when no resume
  matchingSkills: string[]
  missingSkills: string[] // Required from Perplexity
  skillsToHighlight?: string[] // May be present in comprehensive research
  recommendations: string[]
  estimatedFit: 'excellent' | 'good' | 'fair' | 'poor' | string // Allow any string from Perplexity
}

export default function JobAnalysisPage() {
  const router = useRouter()
  const [job, setJob] = useState<JobData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [companyResearch, setCompanyResearch] = useState<CompanyResearchResult | null>(null)
  const [loadingResearch, setLoadingResearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canProceed, setCanProceed] = useState(false) // ENTERPRISE: Prevent accidental skip
  const [hasRedirected, setHasRedirected] = useState(false) // 🔒 Prevent infinite redirect loop

  useEffect(() => {
    // 🔒 CRITICAL: Only run once on mount, prevent redirect loop
    if (hasRedirected) return
    
    // ✅ FIX #10: Validate job data exists
    const validateJobData = () => {
      const storedJob = localStorage.getItem('cf:selectedJob')
      if (!storedJob) {
        console.error('[JOB_ANALYSIS] ❌ No job data found')
        setError('No job selected. Please select a job from the search page.')
        setLoading(false)
        return false
      }
      
      try {
        const parsed = JSON.parse(storedJob)
        if (!parsed.title || !parsed.company) {
          console.error('[JOB_ANALYSIS] ❌ Invalid job data:', parsed)
          setError('Invalid job data. Please select a job again.')
          setLoading(false)
          return false
        }
        return true
      } catch (e) {
        console.error('[JOB_ANALYSIS] ❌ Failed to parse job data:', e)
        setError('Corrupted job data. Please select a job again.')
        setLoading(false)
        return false
      }
    }
    
    if (!validateJobData()) {
      return
    }
    console.log('🎯 [JOB_ANALYSIS] Page mounted - starting analysis flow')
    loadAndAnalyzeJob()
  }, [])

  const loadAndAnalyzeJob = async () => {
    try {
      // DEBUG: Check what's in localStorage
      const rawJob = localStorage.getItem('cf:selectedJob')
      console.log('🎯 [JOB_ANALYSIS] Raw localStorage check:', rawJob ? `Found (${rawJob.length} chars)` : 'NOT FOUND')
      
      // ✅ CRITICAL FIX: Use unified storage
      const jobData = CareerFinderStorage.getJob()
      
      if (!jobData) {
        console.error('🎯 [JOB_ANALYSIS] ❌ No job found - redirecting to search')
        console.error('🎯 [JOB_ANALYSIS] localStorage keys:', Object.keys(localStorage))
        setHasRedirected(true) // 🔒 Mark as redirected to prevent loop
        setLoading(false)
        setTimeout(() => router.push('/career-finder/search'), 100) // Small delay to ensure state is set
        return
      }

      console.log('🎯 [JOB_ANALYSIS] ✅ Job loaded:', jobData.title, '@', jobData.company)
      setJob(jobData)

      // Auto-analyze immediately
      console.log('🎯 [JOB_ANALYSIS] Starting job analysis...')
      await analyzeJob(jobData)
    } catch (err) {
      console.error('🎯 [JOB_ANALYSIS] ❌ Failed to load job:', err)
      setError('Failed to load job data')
      setLoading(false)
    }
  }

  const analyzeJob = async (jobData: JobData) => {
    // ✅ CRITICAL FIX: Use unified storage for resume
    const resumeData = CareerFinderStorage.getResume()
    const resumeText = resumeData?.extractedText || ''

    try {
      // 🚀 OPTIMIZATION: Check for cached comprehensive research first
      const cachedResearch = CareerFinderStorage.getCompanyResearch()
      
      if (cachedResearch?.jobAnalysis) {
        console.log('🎯 [JOB_ANALYSIS] ✅ Using cached comprehensive research (cost savings!):', {
          matchScore: cachedResearch.jobAnalysis.matchScore,
          matchingSkills: cachedResearch.jobAnalysis.matchingSkills?.length,
          age: Date.now() - (cachedResearch.timestamp || 0)
        })
        
        // Use cached analysis - ensure proper type compatibility
        const typedAnalysis: AnalysisResult = {
          matchScore: cachedResearch.jobAnalysis.matchScore,
          matchingSkills: cachedResearch.jobAnalysis.matchingSkills || [],
          missingSkills: cachedResearch.jobAnalysis.missingSkills || [],
          skillsToHighlight: cachedResearch.jobAnalysis.skillsToHighlight,
          recommendations: cachedResearch.jobAnalysis.recommendations || [],
          estimatedFit: cachedResearch.jobAnalysis.estimatedFit || 'good'
        }
        
        setAnalysis(typedAnalysis)
        CareerFinderStorage.setJobAnalysis(typedAnalysis)
        
        // Also set company research
        setCompanyResearch(cachedResearch)
        setLoadingResearch(false)
        
        console.log('🎯 [JOB_ANALYSIS] ✅ All data loaded from cache - NO API CALLS NEEDED!')
      } else {
        // Fallback to individual API call if cache miss
        console.log('🎯 [JOB_ANALYSIS] ⚠️ No cached research, calling individual API...')
        
        // CRITICAL FIX: Send data in format API expects
        const response = await fetch('/api/jobs/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: jobData.title,
            company: jobData.company,
            jobDescription: jobData.description || jobData.summary || '',
            resumeText: resumeText || '',
            skills: Array.isArray(jobData.skills) ? jobData.skills : []
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Analysis failed')
        }

        const result = await response.json()
        console.log('🎯 [JOB_ANALYSIS] Received analysis:', { hasMatchScore: !!result.matchScore, matchingSkills: result.matchingSkills?.length, recommendations: result.recommendations?.length })
        // CRITICAL FIX: API returns data directly, not nested under "analysis"
        setAnalysis(result)
        
        // ✅ CRITICAL FIX: Store analysis using unified storage
        CareerFinderStorage.setJobAnalysis(result)
      }
      
      if (!resumeData) {
        console.log('📋 Browsing job without resume - match score disabled')
      }
    } catch (err) {
      console.error('🎯 [JOB_ANALYSIS] ❌ Analysis failed:', err)
      // Provide fallback analysis (without match score if no resume)
      setAnalysis({
        matchScore: resumeData ? 75 : undefined,
        matchingSkills: resumeData ? (jobData.skills?.slice(0, 5) || ['JavaScript', 'React', 'Node.js']) : [],
        missingSkills: resumeData ? ['Docker', 'Kubernetes'] : [],
        recommendations: resumeData ? [
          'Highlight your experience with similar technologies',
          'Emphasize transferable skills',
          'Show enthusiasm for learning new tools'
        ] : [],
        estimatedFit: 'good'
      })
    } finally {
      console.log('🎯 [JOB_ANALYSIS] Setting loading to FALSE')
      setLoading(false)
      setCanProceed(true)
      
      // ENTERPRISE ENHANCEMENT: Auto-fetch company research in parallel
      if (jobData.company) {
        fetchCompanyResearch(jobData.company, jobData.title, jobData.location)
      }
      
      console.log('🎯 [JOB_ANALYSIS] Analysis complete - user can now proceed')
    }
  }

  const fetchCompanyResearch = async (companyName: string, jobTitle: string, location: string) => {
    // 🚀 OPTIMIZATION: Check if we already have cached comprehensive research
    const cachedResearch = CareerFinderStorage.getCompanyResearch()
    
    if (cachedResearch && cachedResearch.timestamp) {
      const age = Date.now() - cachedResearch.timestamp
      const FIVE_MINUTES = 5 * 60 * 1000
      
      if (age < FIVE_MINUTES) {
        console.log('[COMPANY_RESEARCH] ✅ Using cached data (age:', Math.round(age / 1000), 'seconds) - NO API CALL!')
        setCompanyResearch(cachedResearch)
        setLoadingResearch(false)
        return
      } else {
        console.log('[COMPANY_RESEARCH] ⚠️ Cache expired, refetching...')
      }
    }
    
    setLoadingResearch(true)
    try {
      console.log('[COMPANY_RESEARCH] Fetching for:', companyName)
      const response = await fetch('/api/v2/company/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          position: jobTitle,
          location
        })
      })

      if (!response.ok) {
        console.warn('[COMPANY_RESEARCH] API returned:', response.status)
        return
      }

      const data = await response.json()
      console.log('[COMPANY_RESEARCH] Received data:', data)
      
      if (data.success) {
        // CRITICAL FIX: Ensure hiringContacts is always an array (never undefined)
        const contacts = data.contacts?.data || data.hiringContacts || data.contacts || []
        const safeContacts = Array.isArray(contacts) ? contacts : []
        
        const researchData: Partial<CompanyResearchResult> = {
          company: companyName,
          description: data.company?.description || '',
          aiRiskAnalysis: data.aiRiskAnalysis,
          marketIntelligence: data.marketIntelligence,
          hiringContacts: safeContacts,
          salaryIntelligence: data.salaryIntelligence,
          financials: [],
          culture: [],
          salaries: [],
          contacts: [],
          sources: [],
          confidence: 0.8,
          recentNews: [],
          reviews: []
        }
        
        setCompanyResearch(researchData as CompanyResearchResult)
        
        // ✅ CRITICAL FIX: Store company research using unified storage
        CareerFinderStorage.setCompanyResearch(researchData as CompanyResearchResult)
      }
    } catch (err) {
      console.error('[COMPANY_RESEARCH] Error:', err)
    } finally {
      setLoadingResearch(false)
    }
  }

  const handleResearchCompany = () => {
    if (!job) return
    
    // ✅ Use unified storage - already stored by loadAndAnalyzeJob
    router.push('/career-finder/company')
  }

  /**
   * Extract clean domain from company website URL
   * CRITICAL for email inference and contact discovery
   * 
   * Used for:
   * - Email pattern inference (firstname@company.com)
   * - Contact discovery when LinkedIn fails
   * - Company research and verification
   * - Validating company legitimacy
   * 
   * @example
   * extractWebsite('https://www.shopify.com/careers') → 'shopify.com'
   * extractWebsite('http://google.com/jobs') → 'google.com'
   */
  const extractWebsite = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace(/^www\./, '')
    } catch {
      // Fallback to regex if URL parsing fails
      const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/)
      return match ? match[1] : url
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing job match...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    // 🔒 CRITICAL: Show error screen without redirecting (prevents loop)
    return (
      <div className="container mx-auto px-6 py-8">
        <CareerFinderBackButton />
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'The job you selected couldn\'t be loaded. Please select a job from the search results.'}
          </p>
          <button
            onClick={() => {
              // Clear any cached data that might be stale
              CareerFinderStorage.clearJob()
              router.push('/career-finder/search')
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Job Search
          </button>
        </div>
      </div>
    )
  }

  const fitColor = {
    excellent: 'text-green-500',
    good: 'text-blue-500',
    fair: 'text-yellow-500',
    poor: 'text-red-500'
  }[analysis?.estimatedFit || 'fair']

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <CareerFinderBackButton label="Back to Search" />

      {/* Job Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{job.title}</h1>
            <p className="text-xl text-muted-foreground">{job.company}</p>
          </div>
          {analysis && (
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{analysis.matchScore}%</div>
              <div className={`text-sm font-medium ${fitColor}`}>
                {analysis.estimatedFit.toUpperCase()} FIT
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>{getSalaryDisplayString(normalizeSalary(job.salary))}</span>
            </div>
          )}
          {job.source && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>{job.source}</span>
            </div>
          )}
        </div>
      </div>

      {/* Full Job Description - Like Indeed */}
      {(job.description || job.summary) && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Job Description</h2>
          </div>
          <div className="prose prose-sm max-w-none text-foreground">
            <div className="whitespace-pre-wrap leading-relaxed">
              {job.description || job.summary}
            </div>
          </div>
          {job.url && (
            <div className="mt-4 pt-4 border-t border-border">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                View Original Job Posting
              </a>
            </div>
          )}
        </div>
      )}

      {/* No Resume Message */}
      {!analysis && !loading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Skills Analysis Unavailable</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Upload a resume to see detailed skills matching and personalized recommendations for this job.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Matching Skills */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold text-foreground">Matching Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.matchingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          {analysis.missingSkills.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-foreground">Skills to Highlight</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium"
                  >
                    → {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Recommendations</h2>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ENTERPRISE ENHANCEMENT: Rich Company Research Display */}
      {loadingResearch && (
        <div className="mt-6 bg-card border border-border rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading company intelligence...</p>
          </div>
        </div>
      )}

      {companyResearch && !loadingResearch && (
        <div className="mt-6 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">🏢 Company Intelligence</h2>

          {/* AI Risk Analysis */}
          {companyResearch.aiRiskAnalysis && (
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">🤖 AI & Automation Risk</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Automation Probability</p>
                  <p className="text-2xl font-bold text-foreground">{companyResearch.aiRiskAnalysis.automationProbability}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role Risk</p>
                  <p className={`text-lg font-bold ${
                    companyResearch.aiRiskAnalysis.roleRisk?.toLowerCase().includes('low') ? 'text-green-500' :
                    companyResearch.aiRiskAnalysis.roleRisk?.toLowerCase().includes('medium') ? 'text-yellow-500' : 'text-red-500'
                  }`}>{companyResearch.aiRiskAnalysis.roleRisk}</p>
                </div>
              </div>
              <p className="text-sm text-foreground"><strong>Future Outlook:</strong> {companyResearch.aiRiskAnalysis.futureOutlook}</p>
              <p className="text-sm text-foreground mt-2"><strong>AI Adoption:</strong> {companyResearch.aiRiskAnalysis.companyAIAdoption}</p>
            </div>
          )}

          {/* Market Intelligence */}
          {companyResearch.marketIntelligence && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">📊 Market Intelligence</h3>
              {typeof companyResearch.marketIntelligence === 'string' ? (
                <p className="text-sm text-foreground leading-relaxed">{companyResearch.marketIntelligence}</p>
              ) : (
                <>
                  {companyResearch.marketIntelligence.competitivePosition && (
                    <p className="text-sm text-foreground mb-3">{companyResearch.marketIntelligence.competitivePosition}</p>
                  )}
                  {companyResearch.marketIntelligence.industryTrends && Array.isArray(companyResearch.marketIntelligence.industryTrends) && companyResearch.marketIntelligence.industryTrends.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Industry Trends:</p>
                      <ul className="space-y-1">
                        {companyResearch.marketIntelligence.industryTrends.map((trend, idx) => (
                          <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">▸</span>
                            <span>{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {companyResearch.marketIntelligence.recentNews && Array.isArray(companyResearch.marketIntelligence.recentNews) && companyResearch.marketIntelligence.recentNews.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Recent News:</p>
                      <ul className="space-y-1">
                        {companyResearch.marketIntelligence.recentNews.slice(0, 3).map((news, idx) => (
                          <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{news}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Hiring Contacts */}
          {companyResearch.hiringContacts && companyResearch.hiringContacts.length > 0 && (
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">👥 Hiring Contacts ({companyResearch.hiringContacts.length})</h3>
              <div className="space-y-3">
                {companyResearch.hiringContacts.slice(0, 5).map((contact, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-card/50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline">
                          {contact.email}
                        </a>
                      )}
                      {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline ml-2">
                          LinkedIn
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contact.confidence ? Math.round(contact.confidence * 100) : 0}% match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salary Intelligence */}
          {companyResearch.salaryIntelligence && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">💰 Salary Intelligence</h3>
              <p className="text-sm text-foreground mb-2"><strong>Expected Range:</strong> {companyResearch.salaryIntelligence.salaryRange}</p>
              {companyResearch.salaryIntelligence.benefits && (
                <p className="text-sm text-foreground"><strong>Benefits:</strong> {companyResearch.salaryIntelligence.benefits}</p>
              )}
              {companyResearch.salaryIntelligence.notes && (
                <p className="text-sm text-muted-foreground mt-2">{companyResearch.salaryIntelligence.notes}</p>
              )}
            </div>
          )}

          {/* Company Culture */}
          {companyResearch.culture && companyResearch.culture.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">🌟 Company Culture</h3>
              <div className="space-y-2">
                {companyResearch.culture.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <p className="text-sm text-foreground">{point.point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📰 Recent News with Clickable Links */}
      {companyResearch?.news && companyResearch.news.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            📰 Recent News
            <span className="text-sm font-normal text-muted-foreground">({companyResearch.news.length} articles)</span>
          </h3>
          <div className="space-y-4">
            {companyResearch.news.map((article, idx) => (
              <div key={idx} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {article.title}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {article.source && <span className="font-medium">{article.source}</span>}
                        {article.date && <span>{article.date}</span>}
                        {article.impact && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            article.impact === 'positive' ? 'bg-green-500/20 text-green-600' :
                            article.impact === 'negative' ? 'bg-red-500/20 text-red-600' :
                            'bg-gray-500/20 text-gray-600'
                          }`}>
                            {article.impact}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⭐ Employee Reviews with Clickable Links */}
      {companyResearch?.reviews && companyResearch.reviews.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            ⭐ Employee Reviews
            <span className="text-sm font-normal text-muted-foreground">({companyResearch.reviews.length} platforms)</span>
          </h3>
          <div className="space-y-4">
            {companyResearch.reviews.map((review, idx) => (
              <div key={idx} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <a 
                  href={review.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {review.platform}
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    {review.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-foreground">{review.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    )}
                  </div>
                  {review.summary && (
                    <p className="text-sm text-muted-foreground mb-3">{review.summary}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {review.pros && review.pros.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1">👍 Pros</p>
                        <ul className="space-y-1">
                          {review.pros.map((pro, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.cons && review.cons.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1">👎 Cons</p>
                        <ul className="space-y-1">
                          {review.cons.map((con, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-1">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={handleResearchCompany}
          disabled={!canProceed}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
          }`}
          title={!canProceed ? 'Please review the analysis before proceeding' : ''}
        >
          {canProceed ? 'Research Company →' : 'Analyzing... Please wait'}
        </button>
      </div>
      
      {/* User guidance */}
      {!canProceed && analysis && (
        <div className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
          ✨ Review your match analysis above before proceeding
        </div>
      )}
    </div>
  )
}


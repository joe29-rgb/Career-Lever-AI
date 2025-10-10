'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { JobCard } from '@/components/job-card'
import { JobStatusBar, type JobStatus } from '@/components/job-status-bar'
import { ModernJobCard, type ModernJobCardProps } from '@/components/modern-job-card'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import { normalizeSalary, getSalaryDisplayString } from '@/lib/utils/salary-normalizer'

interface JobListing {
  id?: string
  title: string
  company: string
  location: string
  salary?: string
  skills?: string[]
  skillMatchPercent?: number
  aiScore?: number
  url?: string
  source?: string
  [key: string]: unknown
}

export default function SearchPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [filters, setFilters] = useState({ 
    location: '', // CRITICAL: Empty by default - will be populated from resume or user input
    salaryMin: '', 
    salaryMax: '', 
    workType: 'all' as 'all' | 'remote' | 'hybrid' | 'onsite' | 'part-time',
    experienceLevel: '' as '' | 'entry' | 'mid' | 'senior' | 'executive'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // CRITICAL FIX: Always use AI matching for better results
  const [useResumeMatching, setUseResumeMatching] = useState(true)
  const [activeStatus, setActiveStatus] = useState<JobStatus>('discover')
  const [useModernCards, setUseModernCards] = useState(true)
  const [metadata, setMetadata] = useState<{
    useResumeMatching?: boolean
    searchedBoards?: number
    canadianPriority?: boolean
    cachedResults?: boolean
  } | null>(null)
  
  const { data: session, status } = useSession()

  // ENTERPRISE FIX: Cache job results for 20 minutes
  useEffect(() => {
    // Try to load cached results on mount
    try {
      const cached = localStorage.getItem('cf:jobResults')
      const cacheTime = localStorage.getItem('cf:jobResultsTime')
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime)
        const TWENTY_MINUTES = 20 * 60 * 1000
        
        if (age < TWENTY_MINUTES) {
          const cachedData = JSON.parse(cached)
          setJobs(cachedData)
          console.log('[CACHE] Loaded', cachedData.length, 'cached jobs, age:', Math.round(age / 60000), 'minutes')
        } else {
          console.log('[CACHE] Expired, clearing cache')
          localStorage.removeItem('cf:jobResults')
          localStorage.removeItem('cf:jobResultsTime')
        }
      }
    } catch (e) {
      console.error('[CACHE] Failed to load:', e)
    }
  }, [])

  // Handler for job selection - stores job and navigates to analysis
  const handleJobSelection = async (job: JobListing) => {
    try {
      // Store in localStorage for immediate access
      localStorage.setItem('selectedJob', JSON.stringify({
        ...job,
        selectedAt: Date.now()
      }))
      
      // Store in database for history
      await fetch('/api/jobs/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      })
      
      // Navigate to job analysis page
      router.push('/career-finder/job-analysis')
    } catch (error) {
      console.error('Failed to store job:', error)
      // Still navigate even if storage fails
      router.push('/career-finder/job-analysis')
    }
  }

  // ENTERPRISE FIX: Auto-search on mount if query params exist OR autopilot is ready
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const keywords = params.get('keywords')
    const location = params.get('location')
    
    // PERPLEXITY FIX: Read standardized localStorage keys
    const autopilotReady = localStorage.getItem('cf:autopilotReady') === '1'
    const savedLocation = localStorage.getItem('cf:location') || ''
    const savedKeywords = localStorage.getItem('cf:keywords') || ''
    const resumeData = localStorage.getItem('cf:resume')
    
    console.log('[PERPLEXITY AUDIT FIX] Autopilot check:', { 
      autopilotReady, 
      savedLocation, 
      savedKeywords: savedKeywords.slice(0, 50),
      hasResume: !!resumeData,
      hasKeywords: !!savedKeywords // FIX: Check savedKeywords from localStorage, not state
    })
    
    // CRITICAL: Pre-populate location from localStorage if available
    if (savedLocation && !filters.location) {
      setFilters(prev => ({ ...prev, location: savedLocation }))
      console.log('[PERPLEXITY AUDIT FIX] Pre-populated location:', savedLocation)
    }
    
    if (keywords || autopilotReady) {
      if (keywords) {
        setSearchQuery(keywords)
      }
      if (location) setFilters(prev => ({ ...prev, location }))
      
      // Perform search
      const performInitialSearch = async () => {
        let query = keywords
        // CRITICAL FIX: Use savedLocation as fallback, not filters.location (state might not be updated yet)
        const loc = location || savedLocation || filters.location

        // ENTERPRISE FIX: If autopilot mode, extract keywords from resume
        if (!query && autopilotReady && resumeData) {
          try {
            const resume = JSON.parse(resumeData)
            // Extract first 5 keywords from resume
            const resumeText = resume.extractedText || ''
            const response = await fetch('/api/resume/extract-signals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resume: resumeText })
            })
            
            if (response.ok) {
              const signals = await response.json()
              const topKeywords = signals.keywords?.slice(0, 5).join(', ') || ''
              const resumeLocation = signals.location // CRITICAL: No fallback - use actual extracted location
              query = topKeywords
              setSearchQuery(topKeywords)
              if (resumeLocation) {
                setFilters(prev => ({ ...prev, location: resumeLocation }))
              }
              setUseResumeMatching(true)
              console.log('[AUTOPILOT] Auto-search with keywords:', topKeywords, 'location:', resumeLocation || 'NOT FOUND')
            }
          } catch (e) {
            console.error('[AUTOPILOT] Failed to extract keywords:', e)
          }
        }

        if (!query || query.trim().length < 2) {
          console.log('[AUTOPILOT] No valid query, skipping search')
          return
        }
        if (status === 'unauthenticated') return

        setLoading(true)
        setError('')
        
        try {
          // CRITICAL DEBUG: Log exactly what we're sending
          const searchPayload = {
            keywords: query,
            location: loc,
            limit: 50,
            useResumeMatching: autopilotReady && useResumeMatching
          }
          console.log('[AUTOPILOT] Performing search with payload:', searchPayload)
          console.log('[AUTOPILOT] Location debug:', {
            urlParam: location,
            savedInLocalStorage: savedLocation,
            currentFilterState: filters.location,
            finalValue: loc,
            isEmpty: !loc || loc.length === 0
          })
          
          const response = await fetch('/api/jobs/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchPayload)
          })

          const data = await response.json()
          if (response.ok) {
            const jobResults = data.jobs || []
            setJobs(jobResults)
            setMetadata(data.metadata || {})
            console.log('[AUTOPILOT] Search completed:', jobResults.length, 'jobs found')
            
            // ENTERPRISE FIX: Cache results for 20 minutes
            try {
              localStorage.setItem('cf:jobResults', JSON.stringify(jobResults))
              localStorage.setItem('cf:jobResultsTime', Date.now().toString())
              console.log('[CACHE] Stored', jobResults.length, 'jobs')
            } catch (e) {
              console.error('[CACHE] Failed to store:', e)
            }
          }
        } catch (err) {
          console.error('[SEARCH] Error:', err)
        } finally {
          setLoading(false)
        }
      }

      performInitialSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (key: string, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const performSearch = async (keywords?: string, location?: string) => {
    const query = keywords || searchQuery
    const loc = location || filters.location

    if (!query || query.trim().length < 2) {
      setError('Please enter at least 2 characters')
      return
    }

    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/career-finder/search')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log(`[SEARCH] Searching for "${query}" in "${loc}" (Resume: ${useResumeMatching})`)

      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: query,
          location: loc,
          salaryMin: filters.salaryMin ? parseInt(filters.salaryMin) : undefined,
          experienceLevel: filters.experienceLevel || undefined,
          workType: filters.workType === 'all' ? 'any' : filters.workType,
          limit: 50,
          useResumeMatching
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      console.log(`[SEARCH] Found ${data.jobs.length} jobs from ${data.sources?.length || 0} sources`)

      const jobResults = data.jobs || []
      setJobs(jobResults)
      setMetadata(data.metadata || {})
      
      // ENTERPRISE FIX: Cache results for 20 minutes
      try {
        localStorage.setItem('cf:jobResults', JSON.stringify(jobResults))
        localStorage.setItem('cf:jobResultsTime', Date.now().toString())
        console.log('[CACHE] Stored', jobResults.length, 'jobs')
      } catch (e) {
        console.error('[CACHE] Failed to store:', e)
      }

      // Show board recommendations
      if (data.recommendations) {
        console.log(`[SEARCH] Recommended boards: ${data.recommendations.priorityBoards.join(', ')}`)
      }

    } catch (err) {
      console.error('[SEARCH] Error:', err)
      setError((err as Error).message || 'Failed to search jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
    if (!sidebarOpen) document.body.classList.add('sidebar-open')
    else document.body.classList.remove('sidebar-open')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <section className="gradient-hero px-4 py-16 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-4">
            <CareerFinderBackButton />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground text-center drop-shadow-lg">
            🚀 Find Your Dream Job
          </h1>
          <p className="text-foreground/95 text-xl mb-8 text-center font-medium">
            Discover opportunities that match your skills and passion
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-lg font-medium bg-card text-foreground placeholder:text-muted-foreground border-0 shadow-xl focus:ring-4 focus:ring-white/50 transition-all"
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary text-lg px-8 py-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-6 h-6 inline mr-2" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
            
            {/* AI Matching Always Active Indicator */}
            {session && (
              <div className="flex items-center gap-3 justify-center">
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-500/30">
                  <SparklesIcon className="w-5 h-5 text-blue-400 animate-pulse" />
                  <span className="text-foreground font-semibold text-sm">
                    ✨ AI Resume Matching Active
                  </span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-foreground px-4 py-2 rounded-xl text-center">
                {error}
              </div>
            )}
          </form>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Main Content: Job Grid */}
        <main className="flex-1">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold gradient-text">
                  {loading ? 'Searching...' : `${jobs.length} Jobs Found`}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {loading ? 'Searching 25+ job boards...' : 
                   metadata?.useResumeMatching ? 'Ranked by skill match from your resume' :
                   metadata?.canadianPriority ? 'Prioritized Canadian sources' :
                   'Curated opportunities just for you'}
                </p>
              </div>
              <button 
                onClick={toggleSidebar} 
                className="lg:hidden btn-primary flex items-center gap-2"
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Search Metadata */}
            {metadata && jobs.length > 0 && (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 mb-6">
                <div className="flex flex-wrap gap-4 text-sm">
                  {metadata.searchedBoards && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold">📊</span>
                      <span>{metadata.searchedBoards} boards searched</span>
                    </div>
                  )}
                  {metadata.useResumeMatching && (
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">AI Skill Matching Active</span>
                    </div>
                  )}
                  {metadata.cachedResults && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold">⚡</span>
                      <span>Cached results (instant)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Job Status Bar - Figma Design */}
          {jobs.length > 0 && (
            <div className="mb-8">
              <JobStatusBar
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                counts={{
                  discover: jobs.length,
                  saved: 0,
                  applied: 0,
                  closed: 0,
                  discarded: 0
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gradient-border-card animate-pulse">
                  <div className="h-48 bg-muted rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : useModernCards ? (
            /* Modern Figma-Inspired Job Cards */
            <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
              {jobs.map((job, index) => {
                const colorThemes: Array<'purple' | 'red' | 'yellow'> = ['purple', 'red', 'yellow']
                const colorTheme = colorThemes[index % 3]
                
                // Normalize salary for consistent display
                const normalizedSalary = normalizeSalary(job.salary)
                const salaryDisplay = normalizedSalary 
                  ? getSalaryDisplayString(normalizedSalary) 
                  : 'Salary not disclosed'
                
                return (
                  <ModernJobCard
                    key={job.id || `job-${index}`}
                    id={job.id || `job-${index}`}
                    title={job.title}
                    company={job.company}
                    location={job.location}
                    experience={filters.experienceLevel || 'All levels'}
                    workType={filters.workType === 'all' ? 'onsite' : (filters.workType as 'remote' | 'hybrid' | 'onsite' | 'part-time')}
                    salary={salaryDisplay}
                    description={`AI Score: ${job.aiScore || 'N/A'}${job.skillMatchPercent ? ` | Skill Match: ${job.skillMatchPercent}%` : ''}`}
                    postedDate="Posted recently"
                    colorTheme={colorTheme}
                    onView={() => handleJobSelection(job)}
                  />
                )
              })}
            </div>
          ) : (
            /* Legacy Job Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobs.map((job, index) => {
                // Normalize salary for consistent display
                const normalizedSalary = normalizeSalary(job.salary)
                const salaryDisplay = normalizedSalary 
                  ? getSalaryDisplayString(normalizedSalary) 
                  : job.salary || 'Salary not disclosed'
                
                return (
                  <JobCard 
                    key={job.id || `job-${index}`} 
                    job={{...job, salary: salaryDisplay} as any} 
                  />
                )
              })}
            </div>
          )}
        </main>

        {/* Sidebar: Filters */}
        <aside className={`hidden lg:block w-80 sticky top-8 self-start`}>
          <div className="gradient-border-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">
                🎯 Filters
              </h2>
              <button 
                onClick={() => setFilters({ location: '', salaryMin: '', salaryMax: '', workType: 'all', experienceLevel: '' })}
                className="text-sm text-secondary hover:text-primary font-bold transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Work Type Filter */}
              <div>
                <label className="block text-sm font-bold mb-3">💼 Work Type</label>
                <select
                  value={filters.workType}
                  onChange={(e) => handleFilterChange('workType', e.target.value)}
                  className="modern-input w-full"
                >
                  <option value="all">All Types</option>
                  <option value="remote">🏡 Remote</option>
                  <option value="hybrid">🔄 Hybrid</option>
                  <option value="onsite">🏢 At Location</option>
                  <option value="part-time">⏰ Part-time</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-bold mb-3">
                  <MapPinIcon className="w-5 h-5 inline mr-1 text-secondary" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Edmonton, AB"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="modern-input w-full"
                />
              </div>

              {/* Salary Range Filter */}
              <div>
                <label className="block text-sm font-bold mb-3">💰 Salary Range</label>
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  className="modern-input w-full mb-3"
                />
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  className="modern-input w-full"
                />
              </div>

              {/* Experience Level Filter */}
              <div>
                <label className="block text-sm font-bold mb-3">📈 Experience Level</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  className="modern-input w-full"
                >
                  <option value="">Any Level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Filter Modal */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={toggleSidebar}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-card z-50 lg:hidden overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button 
                onClick={toggleSidebar}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="filter-group">
                <label className="block text-sm font-semibold mb-3">💼 Work Type</label>
                <select
                  value={filters.workType}
                  onChange={(e) => handleFilterChange('workType', e.target.value)}
                  className="modern-input w-full"
                >
                  <option value="all">All Types</option>
                  <option value="remote">🏡 Remote</option>
                  <option value="hybrid">🔄 Hybrid</option>
                  <option value="onsite">🏢 At Location</option>
                  <option value="part-time">⏰ Part-time</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="block text-sm font-semibold mb-3">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Edmonton, AB"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="modern-input w-full"
                />
              </div>

              <div className="filter-group">
                <label className="block text-sm font-semibold mb-3">Salary Range</label>
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  className="modern-input w-full mb-3"
                />
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  className="modern-input w-full"
                />
              </div>

              <button 
                onClick={toggleSidebar}
                className="w-full btn-primary py-3 rounded-xl font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


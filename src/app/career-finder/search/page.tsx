'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { JobCard } from '@/components/job-card'

// Mock data - replace with your API fetch (e.g., from /api/job-boards/autopilot/search)
const mockJobs = [
  { id: "1", title: 'Software Developer', company: 'Tech Startup', location: 'Edmonton, AB', salary: '$80k - $100k', skills: ['React', 'Node.js'], url: '/apply/1', logo: '/tech-logo.png' },
  { id: "2", title: 'Account Manager', company: 'Sales Co.', location: 'Toronto, ON', salary: '$90k+', skills: ['Sales', 'CRM'], url: '/apply/2', logo: '/sales-logo.png' },
  // Add more or fetch dynamically
]

export default function SearchPage() {
  const [jobs] = useState(mockJobs)
  const [filters, setFilters] = useState({ location: '', salaryMin: '', salaryMax: '', remote: false })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Fetch jobs based on filters/search (replace with your API)
    // Example: fetch('/api/job-boards/autopilot/search', { method: 'POST', body: JSON.stringify({ keywords: searchQuery, locations: filters.location, ...filters }) })
    // .then(res => res.json()).then(({ results }) => setJobs(results))
    console.log('Fetching jobs with:', { searchQuery, ...filters }) // Log for debugging
  }, [searchQuery, filters])

  const handleFilterChange = (key: string, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Trigger search (e.g., update URL or API call)
    console.log('Searching for:', searchQuery)
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
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white text-center drop-shadow-lg">
            🚀 Find Your Dream Job
          </h1>
          <p className="text-white/95 text-xl mb-8 text-center font-medium">
            Discover opportunities that match your skills and passion
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-lg font-medium bg-card text-foreground placeholder:text-muted-foreground border-0 shadow-xl focus:ring-4 focus:ring-white/50 transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary text-lg px-8 py-4 whitespace-nowrap"
            >
              <MagnifyingGlassIcon className="w-6 h-6 inline mr-2" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 lg:px-8 py-8 -mt-8">
        {/* Main Content: Job Grid */}
        <main className="flex-1">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold gradient-text">
                {jobs.length} Jobs Found
              </h2>
              <p className="text-muted-foreground mt-1">Curated opportunities just for you</p>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="lg:hidden btn-primary flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </main>

        {/* Sidebar: Filters */}
        <aside className={`hidden lg:block w-80 sticky top-8 self-start`}>
          <div className="gradient-border-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">
                🎯 Filters
              </h2>
              <button 
                onClick={() => setFilters({ location: '', salaryMin: '', salaryMax: '', remote: false })}
                className="text-sm text-secondary hover:text-primary font-bold transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Work Type Filter */}
              <div>
                <label className="block text-sm font-bold mb-3">💼 Work Type</label>
                <div className="flex items-center gap-3 p-4 gradient-card-blue rounded-2xl hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-primary/20">
                  <input 
                    type="checkbox" 
                    id="remote" 
                    checked={filters.remote} 
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                    className="w-5 h-5 rounded-lg border-2 accent-primary"
                  />
                  <label htmlFor="remote" className="text-sm font-bold cursor-pointer">
                    🏡 Remote Only
                  </label>
                </div>
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
                <label className="block text-sm font-semibold mb-3">Work Type</label>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <input 
                    type="checkbox" 
                    id="remote-mobile" 
                    checked={filters.remote} 
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                    className="w-5 h-5 rounded accent-primary"
                  />
                  <label htmlFor="remote-mobile" className="text-sm font-medium">
                    Remote Only
                  </label>
                </div>
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

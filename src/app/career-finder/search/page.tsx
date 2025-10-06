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
    <div className="min-h-screen">
      {/* Hero Search */}
      <section className="search-hero">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Find Your Dream Job</h1>
          <p className="text-white/90 text-lg mb-6">Discover opportunities that match your skills and passion</p>
          <form onSubmit={handleSearch} className="search-input-group">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="search-icon" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="search-btn">
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span className="ml-2">Search</span>
            </button>
          </form>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Main Content: Job Grid */}
        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {jobs.length} Jobs Found
            </h2>
            <button 
              onClick={toggleSidebar} 
              className="lg:hidden btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
          </div>
          <div className="responsive-grid-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </main>

        {/* Sidebar: Filters */}
        <aside className={`hidden lg:block w-80 sticky top-8 self-start`}>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button 
                onClick={() => setFilters({ location: '', salaryMin: '', salaryMax: '', remote: false })}
                className="text-sm text-gray-500 hover:text-blue-600 font-medium"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="filter-group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Work Type</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="remote" 
                    checked={filters.remote} 
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <label htmlFor="remote" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Remote Only
                  </label>
                </div>
              </div>

              <div className="filter-group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Edmonton, AB"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="filter-group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Salary Range</label>
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3"
                />
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button 
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="filter-group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Work Type</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="remote-mobile" 
                    checked={filters.remote} 
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <label htmlFor="remote-mobile" className="text-sm font-medium text-gray-700">
                    Remote Only
                  </label>
                </div>
              </div>

              <div className="filter-group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Edmonton, AB"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="filter-group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Salary Range</label>
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-3"
                />
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
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



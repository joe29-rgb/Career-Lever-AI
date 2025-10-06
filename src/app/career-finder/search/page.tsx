'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { JobCard } from '@/components/job-card'
import { useRouter } from 'next/navigation'

// Mock data - replace with your API fetch (e.g., from /api/job-boards/autopilot/search)
const mockJobs = [
  { id: "1", title: 'Software Developer', company: 'Tech Startup', location: 'Edmonton, AB', salary: '$80k - $100k', skills: ['React', 'Node.js'], url: '/apply/1', logo: '/tech-logo.png' },
  { id: "2", title: 'Account Manager', company: 'Sales Co.', location: 'Toronto, ON', salary: '$90k+', skills: ['Sales', 'CRM'], url: '/apply/2', logo: '/sales-logo.png' },
  // Add more or fetch dynamically
]

export default function SearchPage() {
  const [jobs, setJobs] = useState(mockJobs)
  const [filters, setFilters] = useState({ location: '', salaryMin: '', salaryMax: '', remote: false })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Fetch jobs based on filters/search (replace with your API)
    // Example: fetch('/api/job-boards/autopilot/search', { method: 'POST', body: JSON.stringify({ keywords: searchQuery, locations: filters.location, ...filters }) })
    // .then(res => res.json()).then(({ results }) => setJobs(results))
    console.log('Fetching jobs with:', { searchQuery, ...filters }) // Log for debugging
  }, [searchQuery, filters])

  const handleFilterChange = (key: string, value: any) => {
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
      {/* Hero Search */}
      <section className="search-hero">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-4">Discover Jobs</h1>
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
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 py-8">
        {/* Main Content: Job Grid */}
        <main className="flex-1">
          <div className="job-grid">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </main>

        {/* Sidebar: Filters */}
        <aside className={`filter-sidebar lg:translate-x-0 ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            <button onClick={toggleSidebar} className="sidebar-toggle">
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="filter-group">
            <label className="filter-label">Location</label>
            <div className="filter-checkbox">
              <input 
                type="checkbox" 
                id="remote" 
                checked={filters.remote} 
                onChange={(e) => handleFilterChange('remote', e.target.checked)} 
              />
              <span>Remote</span>
            </div>
            <input
              type="text"
              placeholder="e.g., Edmonton, AB"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">Salary Range</label>
            <input
              type="number"
              placeholder="Min Salary"
              value={filters.salaryMin}
              onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="number"
              placeholder="Max Salary"
              value={filters.salaryMax}
              onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          {/* Add more filters as needed */}
        </aside>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </div>
  )
}



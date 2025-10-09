'use client'

import { useEffect, useState } from 'react'
import CompanyResearch from '@/components/company-research'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

export default function CareerFinderCompanyPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Set progress tracking
    try {
      localStorage.setItem('cf:progress', JSON.stringify({ step: 4, total: 7 }))
    } catch {}
    
    // Load selected job and bridge localStorage keys BEFORE CompanyResearch mounts
    try {
      const jobData = localStorage.getItem('cf:selectedJob')
      if (jobData) {
        const job = JSON.parse(jobData)
        console.log('[COMPANY_PAGE] Loaded selected job:', job)
        setSelectedJob(job)
        
        // Bridge keys for CompanyResearch component (legacy compatibility)
        if (job.company) localStorage.setItem('job:company', job.company)
        if (job.title) localStorage.setItem('job:title', job.title)
        if (job.location) localStorage.setItem('job:location', job.location)
        if (job.url) {
          try {
            const u = new URL(job.url)
            const host = u.hostname.replace(/^www\./, '')
            localStorage.setItem('job:website', 'https://' + host)
          } catch {}
        }
      } else {
        console.warn('[COMPANY_PAGE] No selected job found in localStorage')
      }
    } catch (e) {
      console.error('[COMPANY_PAGE] Failed to load selected job:', e)
    }
    
    // Mark as ready to render CompanyResearch
    setIsReady(true)
  }, [])
  
  // Don't render CompanyResearch until localStorage is bridged
  if (!isReady) {
    return (
      <div className="mobile-container space-y-4">
        <CareerFinderBackButton />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="mobile-container space-y-4">
      <CareerFinderBackButton />
      
      {/* Pass initialCompanyName to avoid race condition */}
      <CompanyResearch 
        initialCompanyName={selectedJob?.company}
        titleOverride="Company Insights" 
        descriptionOverride="Auto-populated overview: social, description, LinkedIn, size, revenue, salaries, psychology, market intelligence, signals, sources, news." 
        autoRun 
        hideInputs 
        hideActions 
      />
      
      <div className="text-right">
        <a className="inline-block px-4 py-2 border rounded" href="/career-finder/optimizer">Next</a>
      </div>
    </div>
  )
}



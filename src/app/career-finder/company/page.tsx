'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'
import CompanyResearchService, { CompanyResearchResult } from '@/lib/company-research-service'

export default function CareerFinderCompanyPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [companyData, setCompanyData] = useState<CompanyResearchResult | null>(null)
  const [researchProgress, setResearchProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    CareerFinderStorage.setProgress(4, 7)
    initializeAndResearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initializeAndResearch = async () => {
    try {
      // ✅ Use unified storage
      const selectedJob = CareerFinderStorage.getJob()
      
      if (!selectedJob) {
        setError('No job selected. Please go back and select a job.')
        setLoading(false)
        return
      }

      console.log('[COMPANY] ✅ Loaded job:', selectedJob.title, '@', selectedJob.company)

      // ✅ Use shared company research service
      const result = await CompanyResearchService.research({
        company: selectedJob.company,
        role: selectedJob.title,
        location: selectedJob.location,
        onProgress: setResearchProgress
      })

      setCompanyData(result)
      setLoading(false)
      
    } catch (error: any) {
      console.error('[COMPANY] ❌ Initialization error:', error)
      setError(error.message || 'Failed to initialize company research')
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError('')
    setLoading(true)
    setResearchProgress(0)
    initializeAndResearch()
  }

  if (loading) {
    return (
      <div className="mobile-container space-y-4">
        <CareerFinderBackButton />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="text-xl font-semibold text-foreground">Researching Company...</h2>
            <div className="w-full max-w-md mx-auto">
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-bar-enhanced" 
                  style={{ width: `${researchProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{researchProgress}% complete</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-container space-y-4">
        <CareerFinderBackButton />
        <div className="error-container max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">Research Error</h2>
          <p className="mb-4">{error}</p>
          <div className="flex gap-4">
            <button 
              onClick={handleRetry}
              className="btn-primary-enhanced"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.back()}
              className="btn-secondary-enhanced"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container space-y-6 pb-8">
      <CareerFinderBackButton />
      
      {companyData && (
        <>
          {/* Company Header */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">{companyData.company}</h1>
            <p className="text-lg text-muted-foreground mb-4">{companyData.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium text-foreground">{companyData.size || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-medium text-foreground">{companyData.revenue || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Industry</p>
                <p className="font-medium text-foreground">{companyData.industry || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Founded</p>
                <p className="font-medium text-foreground">{companyData.founded || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Research Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Psychology */}
            {companyData.psychology && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 card-hover-lift">
                <h3 className="text-xl font-bold text-purple-600 mb-4">🧠 Company Psychology</h3>
                <p className="text-foreground leading-relaxed">{companyData.psychology}</p>
              </div>
            )}

            {/* Market Intelligence */}
            {companyData.marketIntelligence && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 card-hover-lift">
                <h3 className="text-xl font-bold text-blue-600 mb-4">📊 Market Intelligence</h3>
                <p className="text-foreground leading-relaxed">
                  {typeof companyData.marketIntelligence === 'string' 
                    ? companyData.marketIntelligence 
                    : JSON.stringify(companyData.marketIntelligence, null, 2)}
                </p>
              </div>
            )}

            {/* Hiring Contacts */}
            <div className="bg-card rounded-xl shadow-lg border border-border p-6 card-hover-lift">
              <h3 className="text-xl font-bold text-green-600 mb-4">
                👥 Hiring Contacts ({companyData.hiringContacts.length})
              </h3>
              {companyData.hiringContacts && companyData.hiringContacts.length > 0 ? (
                <div className="space-y-3">
                  {companyData.hiringContacts.map((contact: any, index: number) => (
                    <div key={index} className="p-3 bg-secondary rounded-lg">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.title}</p>
                      {contact.email && (
                        <p className="text-sm text-blue-600">{contact.email}</p>
                      )}
                      {contact.department && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.department} • Confidence: {Math.round((contact.confidence || 0.5) * 100)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hiring contacts found. We&apos;ll help you find them in the next step.
                </p>
              )}
            </div>

            {/* Company Culture */}
            {companyData.culture && companyData.culture.length > 0 && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 card-hover-lift">
                <h3 className="text-xl font-bold text-yellow-600 mb-4">🏢 Culture Insights</h3>
                <ul className="space-y-2">
                  {companyData.culture.map((item: any, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span className="text-foreground">{item.point || item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/career-finder/optimizer')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
            >
              Continue to Resume Optimization →
            </button>
          </div>
        </>
      )}
    </div>
  )
}



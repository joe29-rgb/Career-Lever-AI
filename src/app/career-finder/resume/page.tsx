'use client'

export const dynamic = 'force-dynamic'

import { ResumeUpload } from '@/components/resume-upload'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

export default function CareerFinderResumePage() {
  const [existingResume, setExistingResume] = useState<any>(null)
  const [loadingExisting, setLoadingExisting] = useState<boolean>(true)
  
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
          setHasResume(true)
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
            setHasResume(true)
            // Cache it for future use
            try {
              localStorage.setItem('cf:resume', JSON.stringify(mostRecent))
              localStorage.setItem('cf:autopilotReady', '1')
            } catch {}
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
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {existingResume.extractedText?.slice(0, 500)}
                {existingResume.extractedText?.length > 500 && '...'}
              </p>
            </div>

            <div className="flex gap-3">
              <Link 
                href="/career-finder/search"
                className="flex-1 btn-gradient text-center py-3 rounded-xl font-semibold"
              >
                🚀 Continue with this Resume
              </Link>
              <button 
                onClick={() => {
                  setExistingResume(null)
                  setHasResume(false)
                  try {
                    localStorage.removeItem('cf:resume')
                    localStorage.removeItem('cf:autopilotReady')
                  } catch {}
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Upload New
              </button>
            </div>
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
              onUploadSuccess={() => {
                try {
                  localStorage.setItem('cf:autopilotReady', '1')
                  // Trigger re-fetch
                  window.location.reload()
                } catch {}
              }} 
              onUploadError={() => {}}
            />
          </div>
        )}

      </div>
    </div>
  )
}


'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect /resumes to /resume-builder
 * This route is referenced in navigation but doesn't exist
 */
export default function ResumesRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/resume-builder')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Resume Builder...</p>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect /profile to /settings/profile
 * This route is referenced in navigation but doesn't exist
 */
export default function ProfileRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/settings/profile')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Profile Settings...</p>
      </div>
    </div>
  )
}

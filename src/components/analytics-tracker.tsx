'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { analytics } from '@/lib/analytics'

/**
 * Analytics Tracker Component
 * Automatically tracks page views and user sessions
 */
function AnalyticsTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Set user ID when session changes
  useEffect(() => {
    if (session?.user?.id) {
      analytics?.setUserId(session.user.id)
    } else {
      analytics?.setUserId(null)
    }
  }, [session])

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = searchParams ? `${pathname}?${searchParams.toString()}` : pathname
      analytics?.pageView({
        path: pathname,
        title: document.title,
        referrer: document.referrer,
      })

      // Track specific page types
      if (pathname.includes('/dashboard')) {
        analytics?.track('dashboard_view')
      } else if (pathname.includes('/create-application')) {
        analytics?.track('create_application_view')
      } else if (pathname.includes('/resume-builder')) {
        analytics?.track('resume_builder_view')
      } else if (pathname.includes('/cover-letter')) {
        analytics?.track('cover_letter_view')
      } else if (pathname.includes('/job-boards')) {
        analytics?.track('job_boards_view')
      } else if (pathname.includes('/career-finder')) {
        analytics?.track('career_finder_view')
      }
    }
  }, [pathname, searchParams])

  // Track session duration on unmount
  useEffect(() => {
    const sessionStart = Date.now()

    return () => {
      const duration = Date.now() - sessionStart
      analytics?.track('session_duration', { duration })
    }
  }, [])

  return null // This component doesn't render anything
}

// Wrap in Suspense to fix Next.js build error
export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  )
}


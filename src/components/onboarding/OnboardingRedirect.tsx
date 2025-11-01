'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Client-side component that redirects new users to onboarding quiz
 * Place this in the root layout or dashboard pages
 */
export function OnboardingRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only check if authenticated and not already on quiz/auth pages
    if (status === 'authenticated' && pathname && !pathname.startsWith('/onboarding') && !pathname.startsWith('/auth')) {
      const user = session?.user as any
      
      // Check if user has completed onboarding
      if (user && user.onboardingComplete === false && !hasRedirected.current) {
        console.log('[ONBOARDING] User needs to complete quiz, redirecting...', {
          email: user.email,
          onboardingComplete: user.onboardingComplete,
          pathname
        })
        hasRedirected.current = true
        router.push('/onboarding/quiz')
      }
    }
  }, [status, session, pathname, router])

  return null // This component doesn't render anything
}

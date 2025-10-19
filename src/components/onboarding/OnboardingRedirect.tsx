'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    // Only check if authenticated and not already on quiz page
    if (status === 'authenticated' && pathname !== '/onboarding/quiz') {
      const user = session?.user as any
      
      // Check if user has completed onboarding
      if (user && !user.onboardingComplete) {
        console.log('[ONBOARDING] User needs to complete quiz, redirecting...')
        router.push('/onboarding/quiz')
      }
    }
  }, [status, session, pathname, router])

  return null // This component doesn't render anything
}

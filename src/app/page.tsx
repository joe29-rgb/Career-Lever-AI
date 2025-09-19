import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { StatsSection } from '@/components/stats-section'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  // If not authenticated, send users straight to sign-in with a dashboard callback
  redirect('/auth/signin?callbackUrl=/dashboard')
}



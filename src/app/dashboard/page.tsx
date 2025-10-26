import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from './components/dashboard-header'
import { QuickActions } from './components/quick-actions'
import { RecentApplications } from './components/recent-applications'
import { StatsOverview } from './components/stats-overview'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricsHero } from './components/metrics-hero'
import dynamic from 'next/dynamic'
import { ActionCenter } from './components/action-center'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const TrendsChart = dynamic(() => import('./components/trends-chart'), {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  })

  const AIInsights = dynamic(() => import('./components/ai-insights'), {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  })

  const RecentCoverLetters = dynamic(() => import('./components/recent-cover-letters').then(m => m.RecentCoverLetters), {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <main>
        <div className="dashboard-container grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-8">
            <MetricsHero />
            <QuickActions />
            <ActionCenter />
            <TrendsChart />
            <RecentApplications />
          </div>
          <div className="space-y-8">
            <StatsOverview />
            <RecentCoverLetters />
            <AIInsights />
          </div>
        </div>
      </main>
    </div>
  )
}


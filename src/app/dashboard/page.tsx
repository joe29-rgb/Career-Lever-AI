import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from './components/dashboard-header'
import { QuickActions } from './components/quick-actions'
import { RecentApplications } from './components/recent-applications'
import { StatsOverview } from './components/stats-overview'
import { RecentCoverLetters } from './components/recent-cover-letters'
import { EnterpriseSidebar } from './components/enterprise-sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricsHero } from './components/metrics-hero'
import dynamic from 'next/dynamic'
import { AIInsights } from './components/ai-insights'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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


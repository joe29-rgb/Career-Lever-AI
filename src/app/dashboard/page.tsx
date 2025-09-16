import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardHeader } from './components/dashboard-header'
import { QuickActions } from './components/quick-actions'
import { RecentApplications } from './components/recent-applications'
import { StatsOverview } from './components/stats-overview'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <QuickActions />
            <RecentApplications />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <StatsOverview />
          </div>
        </div>
      </main>
    </div>
  )
}


import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { JobBoardsDashboard } from './components/job-boards-dashboard'

export default async function JobBoardsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Job Board Integrations</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Automate your job applications across multiple platforms with AI-optimized submissions
          </p>
        </div>

        <Suspense fallback={<JobBoardsSkeleton />}>
          <JobBoardsDashboard userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function JobBoardsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Overview Skeleton - Dribbble Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card animate-pulse">
            <div className="w-16 h-4 bg-muted rounded mb-2"></div>
            <div className="w-8 h-8 bg-muted rounded"></div>
          </div>
        ))}
      </div>

      {/* Job Boards Grid Skeleton - Dribbble Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="modern-card animate-pulse">
            <div className="w-24 h-6 bg-muted rounded mb-4"></div>
            <div className="w-full h-20 bg-muted rounded mb-4"></div>
            <div className="w-20 h-4 bg-muted rounded mb-3"></div>
            <div className="w-16 h-8 bg-primary/20 rounded"></div>
          </div>
        ))}
      </div>

      {/* Bulk Actions Skeleton - Dribbble Style */}
      <div className="gradient-border-card animate-pulse">
        <div className="w-32 h-6 bg-muted rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="w-full h-10 bg-muted rounded"></div>
          <div className="w-full h-10 bg-muted rounded"></div>
          <div className="w-full h-10 bg-muted rounded"></div>
        </div>
        <div className="w-32 h-10 bg-gradient-primary/20 rounded"></div>
      </div>
    </div>
  )
}












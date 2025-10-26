import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { NetworkDashboard } from './components/network-dashboard'

export default async function NetworkPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Professional Network</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Connect with fellow job seekers, share opportunities, and build your professional network
          </p>
        </div>

        <Suspense fallback={<NetworkSkeleton />}>
          <NetworkDashboard userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function NetworkSkeleton() {
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

      {/* Feed Skeleton - Dribbble Style */}
      <div className="modern-card">
        <div className="p-6 border-b border-border/50">
          <div className="w-48 h-6 bg-muted rounded mb-4"></div>
          <div className="w-full h-12 bg-muted rounded"></div>
        </div>
        <div className="divide-y divide-border/50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full opacity-50"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-full h-16 bg-muted rounded mb-3"></div>
                  <div className="w-24 h-4 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}












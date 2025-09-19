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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Professional Network</h1>
          <p className="mt-2 text-lg text-gray-600">
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
      {/* Stats Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Feed Skeleton */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-full h-16 bg-gray-200 rounded mb-3"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




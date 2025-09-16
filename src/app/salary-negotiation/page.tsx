import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SalaryNegotiation } from './components/salary-negotiation'

export default async function SalaryNegotiationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Salary Negotiation</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered salary analysis and negotiation strategies to maximize your compensation
          </p>
        </div>

        <Suspense fallback={<SalaryNegotiationSkeleton />}>
          <SalaryNegotiation userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function SalaryNegotiationSkeleton() {
  return (
    <div className="space-y-8">
      {/* Input Form Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="w-full h-12 bg-gray-200 rounded"></div>
          <div className="w-full h-12 bg-gray-200 rounded"></div>
          <div className="w-full h-12 bg-gray-200 rounded"></div>
          <div className="w-full h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="w-32 h-10 bg-gray-200 rounded"></div>
      </div>

      {/* Results Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}


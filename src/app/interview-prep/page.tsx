import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { InterviewPreparation } from './components/interview-preparation'

export default async function InterviewPrepPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Preparation</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered interview preparation tailored to your target role and company
          </p>
        </div>

        <Suspense fallback={<InterviewPrepSkeleton />}>
          <InterviewPreparation userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function InterviewPrepSkeleton() {
  return (
    <div className="space-y-8">
      {/* Job Selection Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
        <div className="w-full h-12 bg-gray-200 rounded mb-4"></div>
        <div className="w-32 h-10 bg-gray-200 rounded"></div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
              <div className="w-24 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="w-full h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



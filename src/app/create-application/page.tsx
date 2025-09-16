import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ApplicationWorkflow } from './components/application-workflow'

export default async function CreateApplicationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Job Application</h1>
          <p className="mt-2 text-lg text-gray-600">
            Follow our AI-powered workflow to create a tailored job application
          </p>
        </div>

        <Suspense fallback={<ApplicationWorkflowSkeleton />}>
          <ApplicationWorkflow userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function ApplicationWorkflowSkeleton() {
  return (
    <div className="space-y-8">
      {/* Progress indicator skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="ml-2 w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              {step < 4 && <div className="ml-4 w-8 h-0.5 bg-gray-200"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}


import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ResumeBuilder } from './components/resume-builder'

export default async function ResumeBuilderPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Resume Builder</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Create professional, ATS-optimized resumes with AI assistance and beautiful templates
          </p>
        </div>

        <Suspense fallback={<ResumeBuilderSkeleton />}>
          <ResumeBuilder userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function ResumeBuilderSkeleton() {
  return (
    <div className="space-y-8">
      {/* Template Selection Skeleton */}
      <div className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Builder Interface Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
              <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="w-full h-10 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
            <div className="w-24 h-6 bg-gray-200 rounded mb-4"></div>
            <div className="w-full h-64 bg-gray-200 rounded"></div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
            <div className="w-20 h-6 bg-gray-200 rounded mb-4"></div>
            <div className="w-full h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}












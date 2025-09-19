import { Suspense } from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SkillAnalysis } from './components/skill-analysis'

export default async function SkillAnalysisPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Skill Analysis</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered career planning and skill gap analysis to accelerate your professional growth
          </p>
        </div>

        <Suspense fallback={<SkillAnalysisSkeleton />}>
          <SkillAnalysis userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  )
}

function SkillAnalysisSkeleton() {
  return (
    <div className="space-y-8">
      {/* Input Section Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Career Path Skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="w-40 h-6 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div className="w-20 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}




/**
 * Lazy-loaded components for better performance
 * 
 * Heavy components are dynamically imported to reduce initial bundle size
 * and improve page load times.
 */

import dynamic from 'next/dynamic'
import { SkeletonLoader } from '@/components/skeleton-loader'
import { Loader2 } from 'lucide-react'

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
)

// Perplexity Analysis Display (heavy charts and visualizations)
export const LazyPerplexityAnalysis = dynamic(
  () => import('@/components/resume-builder/perplexity-analysis-display').then(mod => ({ default: mod.PerplexityAnalysisDisplay })),
  {
    loading: () => <SkeletonLoader variant="card" lines={8} />,
    ssr: false
  }
)

// Resume Preview Modal (heavy PDF generation)
export const LazyResumePreview = dynamic(
  () => import('@/components/resume-builder/resume-preview-modal').then(mod => ({ default: mod.ResumePreviewButton })),
  {
    loading: () => <LoadingFallback />,
    ssr: false
  }
)

// Job Boards Dashboard (heavy with multiple API calls)
export const LazyJobBoardsDashboard = dynamic(
  () => import('@/app/job-boards/components/job-boards-dashboard').then(mod => ({ default: mod.JobBoardsDashboard })),
  {
    loading: () => <SkeletonLoader variant="card" lines={12} />,
    ssr: false
  }
)

// Resume Customizer (heavy AI processing)
export const LazyResumeCustomizer = dynamic(
  () => import('@/components/resume-customizer').then(mod => ({ default: mod.ResumeCustomizer })),
  {
    loading: () => <SkeletonLoader variant="card" lines={8} />,
    ssr: false
  }
)

// Autopilot Progress Tracker (only needed during autopilot)
export const LazyAutopilotTracker = dynamic(
  () => import('@/components/autopilot-progress-tracker').then(mod => ({ default: mod.AutopilotProgressTracker })),
  {
    loading: () => null,
    ssr: false
  }
)

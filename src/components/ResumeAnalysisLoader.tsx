'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'

interface ResumeAnalysisLoaderProps {
  onComplete?: () => void
  autoProgress?: boolean
}

export function ResumeAnalysisLoader({ onComplete, autoProgress = true }: ResumeAnalysisLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'analyzing' | 'matching' | 'finding'>('analyzing')

  useEffect(() => {
    if (!autoProgress) return

    // Stage 1: Analyzing resume (0-33%)
    const stage1 = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 33) {
          clearInterval(stage1)
          setStage('matching')
          return prev
        }
        return prev + 1
      })
    }, 50)

    // Stage 2: Matching skills (33-66%)
    const stage2Timeout = setTimeout(() => {
      const stage2 = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 66) {
            clearInterval(stage2)
            setStage('finding')
            return prev
          }
          return prev + 1
        })
      }, 50)

      // Stage 3: Finding jobs (66-100%)
      const stage3Timeout = setTimeout(() => {
        const stage3 = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(stage3)
              setTimeout(() => {
                onComplete?.()
              }, 500)
              return 100
            }
            return prev + 1
          })
        }, 50)

        return () => clearInterval(stage3)
      }, 1650) // 33 steps × 50ms

      return () => {
        clearInterval(stage2)
        clearTimeout(stage3Timeout)
      }
    }, 1650) // 33 steps × 50ms

    return () => {
      clearInterval(stage1)
      clearTimeout(stage2Timeout)
    }
  }, [autoProgress, onComplete])

  const getStageInfo = () => {
    switch (stage) {
      case 'analyzing':
        return {
          icon: '🔍',
          title: 'Analyzing Resume',
          description: 'Extracting skills, experience, and qualifications...',
          color: 'text-blue-600 dark:text-blue-400'
        }
      case 'matching':
        return {
          icon: '🎯',
          title: 'Matching Skills',
          description: 'Weighting your expertise and identifying strengths...',
          color: 'text-purple-600 dark:text-purple-400'
        }
      case 'finding':
        return {
          icon: '✨',
          title: 'Finding Jobs',
          description: 'Searching for the best opportunities for you...',
          color: 'text-green-600 dark:text-green-400'
        }
    }
  }

  const stageInfo = getStageInfo()

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="text-6xl animate-bounce">
              {stageInfo.icon}
            </div>
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="text-6xl">{stageInfo.icon}</div>
            </div>
          </div>
        </div>

        {/* Stage Title */}
        <h2 className={`text-2xl font-bold text-center mb-2 ${stageInfo.color}`}>
          {stageInfo.title}
        </h2>

        {/* Stage Description */}
        <p className="text-center text-muted-foreground mb-6">
          {stageInfo.description}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress}%</span>
            <span className="font-medium">
              {stage === 'analyzing' && 'Step 1 of 3'}
              {stage === 'matching' && 'Step 2 of 3'}
              {stage === 'finding' && 'Step 3 of 3'}
            </span>
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`h-2 w-2 rounded-full transition-all ${progress >= 1 ? 'bg-blue-500 scale-125' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${progress >= 34 ? 'bg-purple-500 scale-125' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${progress >= 67 ? 'bg-green-500 scale-125' : 'bg-gray-300'}`} />
        </div>

        {/* Fun fact or tip */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <span className="font-medium">Pro tip:</span> We&apos;re analyzing your resume with AI to find the perfect job matches for your unique skills and experience.
          </p>
        </div>
      </div>
    </div>
  )
}

// Manual control version for API-driven progress
export function ResumeAnalysisLoaderManual({ 
  progress, 
  stage 
}: { 
  progress: number
  stage: 'analyzing' | 'matching' | 'finding'
}) {
  const getStageInfo = () => {
    switch (stage) {
      case 'analyzing':
        return {
          icon: '🔍',
          title: 'Analyzing Resume',
          description: 'Extracting skills, experience, and qualifications...',
          color: 'text-blue-600 dark:text-blue-400'
        }
      case 'matching':
        return {
          icon: '🎯',
          title: 'Matching Skills',
          description: 'Weighting your expertise and identifying strengths...',
          color: 'text-purple-600 dark:text-purple-400'
        }
      case 'finding':
        return {
          icon: '✨',
          title: 'Finding Jobs',
          description: 'Searching for the best opportunities for you...',
          color: 'text-green-600 dark:text-green-400'
        }
    }
  }

  const stageInfo = getStageInfo()

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="text-6xl animate-bounce">
              {stageInfo.icon}
            </div>
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="text-6xl">{stageInfo.icon}</div>
            </div>
          </div>
        </div>

        <h2 className={`text-2xl font-bold text-center mb-2 ${stageInfo.color}`}>
          {stageInfo.title}
        </h2>

        <p className="text-center text-muted-foreground mb-6">
          {stageInfo.description}
        </p>

        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(progress)}%</span>
            <span className="font-medium">
              {stage === 'analyzing' && 'Step 1 of 3'}
              {stage === 'matching' && 'Step 2 of 3'}
              {stage === 'finding' && 'Step 3 of 3'}
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          <div className={`h-2 w-2 rounded-full transition-all ${progress >= 1 ? 'bg-blue-500 scale-125' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${progress >= 34 ? 'bg-purple-500 scale-125' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${progress >= 67 ? 'bg-green-500 scale-125' : 'bg-gray-300'}`} />
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <span className="font-medium">Pro tip:</span> We&apos;re analyzing your resume with AI to find the perfect job matches for your unique skills and experience.
          </p>
        </div>
      </div>
    </div>
  )
}

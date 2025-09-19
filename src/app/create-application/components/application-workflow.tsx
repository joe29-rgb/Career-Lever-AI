'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Search,
  Building,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { ResumeUpload } from '@/components/resume-upload'
import { JobAnalysisForm } from '@/components/job-analysis'
import { CompanyResearchPanel } from '@/components/company-research'
import { ResumeCustomizer } from '@/components/resume-customizer'
import { Resume, JobAnalysis, CompanyData } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const STEPS = [
  {
    id: 'upload',
    title: 'Upload Resume',
    description: 'Upload your resume for AI analysis',
    icon: Upload,
    component: 'resume-upload'
  },
  {
    id: 'analyze',
    title: 'Analyze Job',
    description: 'Paste job description for AI analysis',
    icon: Search,
    component: 'job-analysis'
  },
  {
    id: 'research',
    title: 'Research Company',
    description: 'Gather company insights',
    icon: Building,
    component: 'company-research'
  },
  {
    id: 'customize',
    title: 'Customize Resume',
    description: 'Tailor your resume with AI',
    icon: FileText,
    component: 'resume-customizer'
  }
]

interface ApplicationWorkflowProps {
  userId: string
}

export function ApplicationWorkflow({ userId }: ApplicationWorkflowProps) {
  const searchParams = useSearchParams()
  const initialStepFromQuery = useMemo(() => {
    const step = (searchParams?.get('step') || '').toLowerCase()
    switch (step) {
      case 'upload': return 0
      case 'analyze': return 1
      case 'research': return 2
      case 'customize': return 3
      default: return 0
    }
  }, [searchParams])
  const [currentStep, setCurrentStep] = useState(initialStepFromQuery)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [workflowData, setWorkflowData] = useState<{
    resume?: Resume
    jobAnalysis?: { analysis: JobAnalysis; keywords: string[] }
    companyData?: CompanyData
    customizedResume?: any
  }>({})
  const router = useRouter()

  const handleStepComplete = (stepIndex: number, data: any) => {
    const newCompletedSteps = new Set(completedSteps)
    newCompletedSteps.add(stepIndex)
    setCompletedSteps(newCompletedSteps)

    setWorkflowData(prev => ({
      ...prev,
      ...data
    }))

    // Auto-advance to next step if not the last step
    if (stepIndex < STEPS.length - 1) {
      setTimeout(() => {
        setCurrentStep(stepIndex + 1)
      }, 1500)
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      // Here you could save the complete application to the database
      toast.success('Application created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to save application')
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ResumeUpload
            onUploadSuccess={(resume) => {
              handleStepComplete(0, { resume })
            }}
            onUploadError={(error) => {
              toast.error(error)
            }}
          />
        )

      case 1:
        return (
          <JobAnalysisForm
            onAnalysisComplete={(analysis) => {
              handleStepComplete(1, { jobAnalysis: analysis })
            }}
            onError={(error) => {
              toast.error(error)
            }}
          />
        )

      case 2:
        return (
          <CompanyResearchPanel
            companyName={workflowData.jobAnalysis?.analysis.companyName}
            onResearchComplete={(companyData) => {
              handleStepComplete(2, { companyData })
            }}
            onError={(error) => {
              toast.error(error)
            }}
          />
        )

      case 3:
        return workflowData.resume && workflowData.jobAnalysis ? (
          <ResumeCustomizer
            resume={workflowData.resume}
            jobAnalysis={workflowData.jobAnalysis}
            onCustomizationComplete={(customizedResume) => {
              handleStepComplete(3, { customizedResume })
            }}
            onError={(error) => {
              toast.error(error)
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Please complete the previous steps first.</p>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const isStepAccessible = (stepIndex: number) => {
    // Allow users to jump to any step (job analysis/company research without resume)
    return true
  }

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.has(stepIndex)
  }

  const canProceedToNext = () => {
    return completedSteps.has(currentStep)
  }

  const overallProgress = (completedSteps.size / STEPS.length) * 100

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application Progress</CardTitle>
              <CardDescription>
                Complete each step to create your tailored job application
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {completedSteps.size} of {STEPS.length} steps completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={overallProgress} className="w-full" />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = isStepCompleted(index)
              const isCurrent = index === currentStep
              const isAccessible = isStepAccessible(index)

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(index)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : isAccessible
                        ? 'hover:bg-gray-100 text-gray-600'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`p-2 rounded-full mb-2 ${
                      isCurrent
                        ? 'bg-blue-200'
                        : isCompleted
                        ? 'bg-green-200'
                        : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{step.title}</div>
                      <div className="text-xs opacity-75 hidden sm:block">{step.description}</div>
                    </div>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep].icon, { className: "h-5 w-5" })}
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep].description}
            </CardDescription>
          </CardHeader>
        </Card>

        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep === STEPS.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={!completedSteps.has(STEPS.length - 1)}
                  size="lg"
                >
                  Complete Application
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Panel */}
      {completedSteps.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
            <CardDescription>
              Overview of your completed work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowData.resume && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Resume Uploaded</div>
                    <div className="text-xs text-gray-600">{workflowData.resume.originalFileName}</div>
                  </div>
                </div>
              )}

              {workflowData.jobAnalysis && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Job Analyzed</div>
                    <div className="text-xs text-gray-600">{workflowData.jobAnalysis.analysis.jobTitle}</div>
                  </div>
                </div>
              )}

              {workflowData.companyData && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">Company Researched</div>
                    <div className="text-xs text-gray-600">{workflowData.companyData.companyName}</div>
                  </div>
                </div>
              )}

              {workflowData.customizedResume && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium">Resume Customized</div>
                    <div className="text-xs text-gray-600">{workflowData.customizedResume.matchScore}% match</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

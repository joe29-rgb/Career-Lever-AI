'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'
import { Lightbulb, MessageSquare, Target, Download, Loader2 } from 'lucide-react'

interface Application {
  id: string
  company: string
  jobTitle: string
  location?: string
  status: string
  appliedAt: string
  hasInterviewPrep: boolean
}

interface InterviewPrep {
  questions: string[]
  companyInsights: string
  talkingPoints: string[]
  company: string
  jobTitle: string
}

export default function InterviewPrepPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [prep, setPrep] = useState<InterviewPrep | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications/list')
      if (response.ok) {
        const apps = await response.json()
        setApplications(apps)
        console.log('[INTERVIEW_PREP] Loaded', apps.length, 'applications')
      }
    } catch (error) {
      console.error('[INTERVIEW_PREP] Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePrep = async () => {
    if (!selectedApp) return

    setGenerating(true)
    try {
      // Get resume and company research from storage
      const resume = CareerFinderStorage.getResume()
      const companyResearch = CareerFinderStorage.getCompanyResearch()

      const response = await fetch('/api/interview-prep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          resumeText: resume?.extractedText,
          companyResearch
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPrep(data.prep)
        console.log('[INTERVIEW_PREP] ✅ Generated prep with', data.prep.questions.length, 'questions')
      } else {
        console.error('[INTERVIEW_PREP] Failed to generate prep')
      }
    } catch (error) {
      console.error('[INTERVIEW_PREP] Error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const downloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('[INTERVIEW_PREP] PDF download requested')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="gradient-hero p-8 rounded-b-3xl shadow-2xl mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <CareerFinderBackButton />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-center mb-3">🎯 Interview Prep</h1>
          <p className="text-foreground/90 text-center text-lg">
            AI-powered interview preparation for your applications
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6">
              Apply to jobs first to generate interview prep
            </p>
            <button
              onClick={() => router.push('/career-finder/search')}
              className="btn-primary"
            >
              Find Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Application Selection */}
            <div className="lg:col-span-1">
              <div className="gradient-border-card">
                <h3 className="text-xl font-bold mb-4">Your Applications</h3>
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedApp?.id === app.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-border hover:border-blue-300'
                      }`}
                    >
                      <h4 className="font-bold text-foreground">{app.jobTitle}</h4>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          app.status === 'applied' ? 'bg-green-100 text-green-700' :
                          app.status === 'interview_scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                        {app.hasInterviewPrep && (
                          <span className="text-xs text-green-600">✓ Prep Ready</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Interview Prep Content */}
            <div className="lg:col-span-2">
              {!selectedApp ? (
                <div className="gradient-border-card text-center py-12">
                  <Lightbulb className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Interview Preparation</h1>
                  <p className="text-muted-foreground">
                    Choose an application from the left to generate interview prep
                  </p>
                </div>
              ) : !prep ? (
                <div className="gradient-border-card text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Generate Interview Prep</h3>
                  <p className="text-muted-foreground mb-6">
                    AI will create tailored interview questions and insights for<br />
                    <strong>{selectedApp.jobTitle}</strong> at <strong>{selectedApp.company}</strong>
                  </p>
                  <button
                    onClick={generatePrep}
                    disabled={generating}
                    className="btn-primary"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Generate Prep
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="gradient-border-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{prep.jobTitle}</h2>
                        <p className="text-muted-foreground">{prep.company}</p>
                      </div>
                      <button onClick={downloadPDF} className="btn-secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* Company Insights */}
                  <div className="gradient-border-card">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Company Insights
                    </h3>
                    <p className="text-foreground whitespace-pre-wrap">{prep.companyInsights}</p>
                  </div>

                  {/* Interview Questions */}
                  <div className="gradient-border-card">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Interview Questions ({prep.questions.length})
                    </h3>
                    <div className="space-y-4">
                      {prep.questions.map((question, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <p className="flex-1 text-foreground pt-1">{question}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Talking Points */}
                  <div className="gradient-border-card">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Key Talking Points
                    </h3>
                    <ul className="space-y-2">
                      {prep.talkingPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button onClick={generatePrep} className="btn-secondary flex-1">
                      🔄 Regenerate
                    </button>
                    <button
                      onClick={() => router.push('/career-finder/salary-negotiation')}
                      className="btn-primary flex-1"
                    >
                      Next: Salary Negotiation →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

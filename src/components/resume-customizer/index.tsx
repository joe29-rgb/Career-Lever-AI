'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Wand2,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Target,
  Lightbulb,
  TrendingUp
} from 'lucide-react'
import { Resume, JobAnalysis } from '@/types'
import toast from 'react-hot-toast'

interface ResumeCustomizerProps {
  resume: Resume
  jobAnalysis: { analysis: JobAnalysis; keywords: string[] }
  onCustomizationComplete: (customizedResume: any) => void
  onError: (error: string) => void
}

export function ResumeCustomizer({
  resume,
  jobAnalysis,
  onCustomizationComplete,
  onError
}: ResumeCustomizerProps) {
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizationProgress, setCustomizationProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [customizedResult, setCustomizedResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('preview')

  const handleCustomize = async () => {
    setIsCustomizing(true)
    setCustomizationProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCustomizationProgress(prev => Math.min(prev + 20, 90))
      }, 300)

      const response = await fetch('/api/resume/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume._id,
          jobDescription: [
            jobAnalysis.analysis.jobTitle,
            jobAnalysis.analysis.companyName,
            ...jobAnalysis.analysis.keyRequirements,
            ...jobAnalysis.analysis.preferredSkills,
            ...jobAnalysis.analysis.responsibilities,
            ...jobAnalysis.analysis.companyCulture
          ].filter(Boolean).join('. '),
          jobTitle: jobAnalysis.analysis.jobTitle,
          companyName: jobAnalysis.analysis.companyName,
        }),
      })

      clearInterval(progressInterval)
      setCustomizationProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Customization failed')
      }

      const data = await response.json()
      setCustomizedResult(data)
      onCustomizationComplete(data.customizedResume)

      toast.success('Resume customized successfully!')

    } catch (error) {
      console.error('Customization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Customization failed'
      setError(errorMessage)
      onError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsCustomizing(false)
      setTimeout(() => setCustomizationProgress(0), 1000)
    }
  }

  const downloadResume = () => {
    if (!customizedResult) return

    // Create a simple text file for download
    const blob = new Blob([customizedResult.customizedResume.customizedText], {
      type: 'text/plain'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customized-resume-${jobAnalysis.analysis.companyName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Resume downloaded!')
  }

  return (
    <div className="space-y-6">
      {/* Customization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Resume Customization
          </CardTitle>
          <CardDescription>
            AI-powered resume tailoring based on job requirements and company insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Match Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Target Job</p>
                  <p className="text-lg font-semibold">{jobAnalysis.analysis.jobTitle}</p>
                  <p className="text-sm text-gray-600">{jobAnalysis.analysis.companyName}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Keywords Found</p>
                  <p className="text-lg font-semibold">{jobAnalysis.keywords.length}</p>
                  <p className="text-sm text-gray-600">relevant terms</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Experience Level</p>
                  <p className="text-lg font-semibold">{jobAnalysis.analysis.experienceLevel}</p>
                  <p className="text-sm text-gray-600">required</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isCustomizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customizing resume...</span>
                <span className="text-sm text-gray-600">{customizationProgress}%</span>
              </div>
              <Progress value={customizationProgress} className="w-full" />
            </div>
          )}

          {/* Action Button */}
          {!customizedResult && (
            <Button
              onClick={handleCustomize}
              disabled={isCustomizing}
              size="lg"
              className="w-full"
            >
              {isCustomizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Customizing Resume...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Customize Resume with AI
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {customizedResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Customization Complete
                </CardTitle>
                <CardDescription>
                  Your resume has been optimized for the {jobAnalysis.analysis.jobTitle} position at {jobAnalysis.analysis.companyName}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadResume}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Customized Resume</h4>
                    <Badge variant="secondary">
                      {customizedResult.matchScore}% Match Score
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto border rounded p-4 bg-white">
                    {customizedResult.customizedResume.customizedText}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="improvements" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Applied Improvements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customizedResult.improvements.map((improvement: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-green-800">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Additional Suggestions</h4>
                  <div className="space-y-3">
                    {customizedResult.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {customizedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Before vs After Comparison
            </CardTitle>
            <CardDescription>
              See how your resume has been optimized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Original Resume
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border rounded p-3 bg-red-50">
                  {resume.extractedText.substring(0, 500)}...
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Customized Resume
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto border rounded p-3 bg-green-50">
                  {customizedResult.customizedResume.customizedText.substring(0, 500)}...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


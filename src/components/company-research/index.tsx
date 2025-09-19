'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building,
  Search,
  Star,
  Users,
  TrendingUp,
  Globe,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { CompanyData } from '@/types'
import toast from 'react-hot-toast'

interface CompanyResearchPanelProps {
  companyName?: string
  onResearchComplete: (data: CompanyData) => void
  onError: (error: string) => void
}

export function CompanyResearchPanel({
  companyName: initialCompanyName = '',
  onResearchComplete,
  onError
}: CompanyResearchPanelProps) {
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [website, setWebsite] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [researchProgress, setResearchProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [researchResult, setResearchResult] = useState<CompanyData | null>(null)

  const handleResearch = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name')
      return
    }

    setIsResearching(true)
    setResearchProgress(0)
    setError(null)

    try {
      // Simulate progress updates for different research phases
      const progressSteps = [
        { progress: 20, message: 'Searching company information...' },
        { progress: 40, message: 'Analyzing Glassdoor reviews...' },
        { progress: 60, message: 'Checking LinkedIn data...' },
        { progress: 80, message: 'Gathering news and insights...' },
        { progress: 100, message: 'Compiling research results...' }
      ]

      let currentStep = 0
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setResearchProgress(progressSteps[currentStep].progress)
          currentStep++
        } else {
          clearInterval(progressInterval)
        }
      }, 800)

      const response = await fetch('/api/company/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          website: website.trim() || undefined,
        }),
      })

      clearInterval(progressInterval)
      setResearchProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Research failed')
      }

      const data = await response.json()
      setResearchResult(data.companyData)
      onResearchComplete(data.companyData)

      toast.success('Company research completed!')

    } catch (error) {
      console.error('Research error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Research failed'
      setError(errorMessage)
      onError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsResearching(false)
      setTimeout(() => setResearchProgress(0), 1000)
    }
  }

  const refreshResearch = () => {
    if (researchResult) {
      setResearchResult(null)
      handleResearch()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Research
        </CardTitle>
        <CardDescription>
          Get comprehensive insights about companies from multiple sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Research Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="e.g., Google, Microsoft"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isResearching}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              placeholder="https://company.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={isResearching}
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isResearching && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Researching company...</span>
              <span className="text-sm text-gray-600">{researchProgress}%</span>
            </div>
            <Progress value={researchProgress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleResearch}
            disabled={isResearching || !companyName.trim()}
            className="flex-1"
          >
            {isResearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Research Company
              </>
            )}
          </Button>
          {researchResult && (
            <Button variant="outline" onClick={refreshResearch} disabled={isResearching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>

        {/* Research Results */}
        {researchResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Research completed successfully!
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="culture">Culture</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Company Info */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Company</p>
                          <p className="text-lg font-semibold">{researchResult.companyName}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Glassdoor Rating */}
                  {researchResult.glassdoorRating && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Star className="h-8 w-8 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Glassdoor Rating</p>
                            <p className="text-lg font-semibold">{researchResult.glassdoorRating}/5</p>
                            {researchResult.glassdoorReviews && (
                              <p className="text-xs text-gray-600">{researchResult.glassdoorReviews} reviews</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Company Size */}
                  {researchResult.size && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Company Size</p>
                            <p className="text-lg font-semibold">{researchResult.size}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Industry */}
                  {researchResult.industry && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Industry</p>
                            <p className="text-lg font-semibold">{researchResult.industry}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Description */}
                {researchResult.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Company Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {researchResult.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* LinkedIn Data */}
                {researchResult.linkedinData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        LinkedIn Presence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {researchResult.linkedinData.followers && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Followers</span>
                          <span className="font-medium">{researchResult.linkedinData.followers.toLocaleString()}</span>
                        </div>
                      )}
                      {researchResult.linkedinData.employeeCount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Employees</span>
                          <span className="font-medium">{researchResult.linkedinData.employeeCount.toLocaleString()}</span>
                        </div>
                      )}
                      {researchResult.linkedinData.companyPage && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={researchResult.linkedinData.companyPage} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on LinkedIn
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="culture" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Culture & Values</CardTitle>
                    <CardDescription>
                      Insights gathered from reviews and company communications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {researchResult.culture && researchResult.culture.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {researchResult.culture.map((culture, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-blue-800">{culture}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No culture insights available</p>
                    )}
                  </CardContent>
                </Card>

                {researchResult.benefits && researchResult.benefits.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Employee Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {researchResult.benefits.map((benefit, index) => (
                          <Badge key={index} variant="secondary">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="news" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent News & Updates</CardTitle>
                    <CardDescription>
                      Latest company developments and announcements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {researchResult.recentNews && researchResult.recentNews.length > 0 ? (
                      <div className="space-y-4">
                        {researchResult.recentNews.map((news, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-2">{news.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(news.publishedAt).toLocaleDateString()}
                                </div>
                              </div>
                              {news.url && news.url !== '#' && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={news.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No recent news found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Insights</CardTitle>
                    <CardDescription>
                      Key insights to help you tailor your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {researchResult.glassdoorRating && (
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Glassdoor Rating Insight</h4>
                        <p className="text-sm text-yellow-700">
                          With a {researchResult.glassdoorRating}/5 rating, focus on aligning with their company values and demonstrating cultural fit in your application.
                        </p>
                      </div>
                    )}

                    {researchResult.culture && researchResult.culture.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Culture Alignment Tips</h4>
                        <p className="text-sm text-blue-700">
                          Highlight experiences that demonstrate: {researchResult.culture.slice(0, 2).join(', ').toLowerCase()}.
                        </p>
                      </div>
                    )}

                    {researchResult.industry && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Industry Context</h4>
                        <p className="text-sm text-green-700">
                          As a {researchResult.industry.toLowerCase()} company, emphasize relevant technical skills and industry knowledge in your resume.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




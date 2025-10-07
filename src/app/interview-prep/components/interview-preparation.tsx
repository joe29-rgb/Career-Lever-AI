'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  MessageSquare,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  BookOpen,
  Users,
  Lightbulb,
  ChevronRight
} from 'lucide-react'
import JobApplication from '@/models/JobApplication'
import toast from 'react-hot-toast'

interface InterviewPrepData {
  companyOverview: {
    name: string
    industry: string
    culture: string[]
    recentNews: string[]
    keyFacts: string[]
  }
  jobSpecificPrep: {
    roleRequirements: string[]
    technicalSkills: string[]
    behavioralQuestions: Array<{
      question: string
      suggestedAnswer: string
      tips: string[]
    }>
    technicalQuestions: Array<{
      question: string
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      suggestedAnswer: string
      relatedSkills: string[]
    }>
  }
  candidatePreparation: {
    strengths: string[]
    potentialConcerns: string[]
    talkingPoints: string[]
    salaryExpectations: {
      range: string
      justification: string
      negotiationTips: string[]
    }
  }
  practicePlan: {
    timeline: Array<{
      day: number
      activities: string[]
      focus: string
    }>
    mockInterviewQuestions: string[]
    resources: Array<{
      type: 'article' | 'video' | 'tool'
      title: string
      url: string
      description: string
    }>
  }
}

interface InterviewPreparationProps {
  userId: string
}

export function InterviewPreparation({ userId }: InterviewPreparationProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApplication, setSelectedApplication] = useState<string>('')
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    }
  }

  const generatePreparation = async () => {
    if (!selectedApplication) {
      toast.error('Please select a job application')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/interview/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobApplicationId: selectedApplication,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate preparation')
      }

      const data = await response.json()
      setPrepData(data.preparation)
      toast.success('Interview preparation generated successfully!')
    } catch (error) {
      console.error('Preparation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate preparation')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-muted text-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Job Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Job Application
          </CardTitle>
          <CardDescription>
            Choose the job application you want to prepare for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app._id} value={app._id}>
                      {app.jobTitle} at {app.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generatePreparation}
              disabled={loading || !selectedApplication}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Prepare
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preparation Content */}
      {prepData && (
        <div className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Interview preparation generated for {prepData.companyOverview.name} - {prepData.jobSpecificPrep.roleRequirements[0]}
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="preparation">Preparation</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Company Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Overview</CardTitle>
                    <CardDescription>Get to know {prepData.companyOverview.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Industry</h4>
                      <p className="text-muted-foreground">{prepData.companyOverview.industry}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Key Facts</h4>
                      <ul className="space-y-1">
                        {prepData.companyOverview.keyFacts.map((fact, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Company Culture</CardTitle>
                    <CardDescription>Values and work environment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {prepData.companyOverview.culture.map((value, index) => (
                        <Badge key={index} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Role Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Requirements</CardTitle>
                  <CardDescription>What the company is looking for</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Key Requirements</h4>
                      <ul className="space-y-2">
                        {prepData.jobSpecificPrep.roleRequirements.map((req, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {prepData.jobSpecificPrep.technicalSkills.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <Tabs defaultValue="behavioral">
                <TabsList>
                  <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>

                <TabsContent value="behavioral" className="space-y-4">
                  <div className="space-y-4">
                    {prepData.jobSpecificPrep.behavioralQuestions.map((item, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{item.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Suggested Answer</h4>
                            <p className="text-foreground leading-relaxed">{item.suggestedAnswer}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Tips</h4>
                            <ul className="space-y-1">
                              {item.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div className="space-y-4">
                    {prepData.jobSpecificPrep.technicalQuestions.map((item, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{item.question}</CardTitle>
                            <Badge className={getDifficultyColor(item.difficulty)}>
                              {item.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Suggested Answer</h4>
                            <p className="text-foreground leading-relaxed">{item.suggestedAnswer}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Related Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.relatedSkills.map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="preparation" className="space-y-6">
              {/* Your Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Your Strengths
                  </CardTitle>
                  <CardDescription>What you bring to the table</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prepData.candidatePreparation.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Talking Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Key Talking Points
                  </CardTitle>
                  <CardDescription>Points to emphasize during the interview</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {prepData.candidatePreparation.talkingPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Salary Expectations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Salary Expectations
                  </CardTitle>
                  <CardDescription>Negotiation preparation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Suggested Range</h4>
                    <p className="text-lg font-semibold text-green-700">{prepData.candidatePreparation.salaryExpectations.range}</p>
                    <p className="text-sm text-green-600 mt-1">{prepData.candidatePreparation.salaryExpectations.justification}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Negotiation Tips</h4>
                    <ul className="space-y-2">
                      {prepData.candidatePreparation.salaryExpectations.negotiationTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="practice" className="space-y-6">
              {/* Practice Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Practice Timeline
                  </CardTitle>
                  <CardDescription>Your 4-day interview preparation plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prepData.practicePlan.timeline.map((day, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">D{day.day}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Day {day.day}</h4>
                            <p className="text-sm text-muted-foreground">{day.focus}</p>
                          </div>
                        </div>
                        <ul className="space-y-1 ml-11">
                          {day.activities.map((activity, actIndex) => (
                            <li key={actIndex} className="text-sm text-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mock Interview Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Mock Interview Questions
                  </CardTitle>
                  <CardDescription>Practice questions for mock interviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prepData.practicePlan.mockInterviewQuestions.map((question, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                        </div>
                        <span className="text-foreground">{question}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recommended Resources
                  </CardTitle>
                  <CardDescription>Additional materials to enhance your preparation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prepData.practicePlan.resources.map((resource, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {resource.type === 'video' && <Play className="h-4 w-4 text-blue-600" />}
                            {resource.type === 'article' && <BookOpen className="h-4 w-4 text-blue-600" />}
                            {resource.type === 'tool' && <Target className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{resource.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {resource.type}
                              </Badge>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Access Resource
                                <ChevronRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}


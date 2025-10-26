'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BookOpen,
  Clock,
  DollarSign,
  ArrowRight,
  Lightbulb,
  Zap,
  Users
} from 'lucide-react'
import Resume from '@/models/Resume'
import toast from 'react-hot-toast'

interface SkillAnalysisData {
  currentSkills: {
    technical: Array<{ skill: string; level: 'beginner' | 'intermediate' | 'advanced'; confidence: number }>
    soft: Array<{ skill: string; level: 'beginner' | 'intermediate' | 'advanced' }>
  }
  requiredSkills: {
    jobSpecific: Array<{ skill: string; importance: 'critical' | 'important' | 'nice-to-have' }>
    industryStandard: Array<{ skill: string; demand: 'high' | 'medium' | 'low' }>
  }
  skillGaps: {
    critical: Array<{ skill: string; gap: string; priority: 'high' | 'medium' | 'low' }>
    recommended: Array<{ skill: string; reason: string; timeToLearn: string }>
  }
  careerPath: {
    currentLevel: string
    targetLevel: string
    nextSteps: Array<{ step: string; timeline: string; resources: string[] }>
    alternativePaths: Array<{ role: string; match: number; requiredSkills: string[] }>
  }
  learningPlan: {
    shortTerm: Array<{ skill: string; resource: string; duration: string; cost: string }>
    longTerm: Array<{ skill: string; certification: string; timeline: string }>
    dailyHabits: string[]
  }
  marketInsights: {
    salaryImpact: Array<{ skill: string; salaryBoost: string; demand: string }>
    trendingSkills: Array<{ skill: string; growth: string; reason: string }>
    jobMarketFit: number
  }
}

interface SkillAnalysisProps {
  userId: string
}

export function SkillAnalysis({ userId }: SkillAnalysisProps) {
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [targetJob, setTargetJob] = useState('')
  const [targetIndustry, setTargetIndustry] = useState('')
  const [analysisData, setAnalysisData] = useState<SkillAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resume/list')
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
    }
  }

  const generateAnalysis = async () => {
    if (!selectedResume) {
      toast.error('Please select a resume')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/skills/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: selectedResume,
          targetJob: targetJob.trim() || undefined,
          targetIndustry: targetIndustry.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysisData(data.analysis)
      toast.success('Skill analysis completed!')
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-purple-100 text-purple-800'
      default: return 'bg-muted text-foreground'
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-600'
      case 'important': return 'text-orange-600'
      case 'nice-to-have': return 'text-green-600'
      default: return 'text-muted-foreground'
    }
  }

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Skill Gap Analysis
          </CardTitle>
          <CardDescription>
            Analyze your skills and get personalized career development recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resume">Select Resume</Label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume._id} value={resume._id}>
                      {resume.originalFileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetJob">Target Job (Optional)</Label>
              <Input
                id="targetJob"
                placeholder="e.g., Software Engineer"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetIndustry">Target Industry (Optional)</Label>
              <Select value={targetIndustry} onValueChange={setTargetIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateAnalysis}
            disabled={loading || !selectedResume}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Skills...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisData && (
        <div className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Skill analysis completed! Here's your personalized career development plan.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
              <TabsTrigger value="career">Career Path</TabsTrigger>
              <TabsTrigger value="learning">Learning Plan</TabsTrigger>
              <TabsTrigger value="market">Market Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Current Skills Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Skills</CardTitle>
                    <CardDescription>Your current technical competencies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisData.currentSkills.technical.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Zap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{skill.skill}</p>
                              <p className="text-sm text-muted-foreground">Confidence: {skill.confidence}%</p>
                            </div>
                          </div>
                          <Badge className={getSkillLevelColor(skill.level)}>
                            {skill.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Soft Skills</CardTitle>
                    <CardDescription>Your interpersonal and professional skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisData.currentSkills.soft.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{skill.skill}</p>
                            </div>
                          </div>
                          <Badge className={getSkillLevelColor(skill.level)}>
                            {skill.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Required Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Target Role Requirements</CardTitle>
                  <CardDescription>Skills needed for your target position</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Job-Specific Skills</h4>
                      <div className="space-y-2">
                        {analysisData.requiredSkills.jobSpecific.map((skill, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{skill.skill}</span>
                            <Badge variant="outline" className={getImportanceColor(skill.importance)}>
                              {skill.importance}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Industry Standards</h4>
                      <div className="space-y-2">
                        {analysisData.requiredSkills.industryStandard.map((skill, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{skill.skill}</span>
                            <Badge variant="outline" className={getDemandColor(skill.demand)}>
                              {skill.demand} demand
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gaps" className="space-y-6">
              {/* Critical Gaps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Skill Gaps
                  </CardTitle>
                  <CardDescription>High-priority skills you need to acquire</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.skillGaps.critical.map((gap, index) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-800">{gap.skill}</h4>
                            <p className="text-sm text-red-700 mt-1">{gap.gap}</p>
                            <Badge className="mt-2 bg-red-100 text-red-800">
                              {gap.priority} priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Lightbulb className="h-5 w-5" />
                    Recommended Skills
                  </CardTitle>
                  <CardDescription>Skills that would enhance your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.skillGaps.recommended.map((skill, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-background transition-colors">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{skill.skill}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{skill.reason}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{skill.timeToLearn}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="career" className="space-y-6">
              {/* Career Level Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Career Level Assessment</CardTitle>
                  <CardDescription>Your current position and growth trajectory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-foreground">Current Level</h4>
                      <p className="text-lg text-blue-600 font-semibold">{analysisData.careerPath.currentLevel}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                      <h4 className="font-medium text-foreground">Target Level</h4>
                      <p className="text-lg text-green-600 font-semibold">{analysisData.careerPath.targetLevel}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award className="h-8 w-8 text-purple-600" />
                      </div>
                      <h4 className="font-medium text-foreground">Market Fit</h4>
                      <p className="text-lg text-purple-600 font-semibold">{analysisData.marketInsights.jobMarketFit}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps for Growth</CardTitle>
                  <CardDescription>Your personalized career development roadmap</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.careerPath.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{step.step}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{step.timeline}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-2">Recommended resources:</p>
                            <div className="flex flex-wrap gap-2">
                              {step.resources.map((resource, resIndex) => (
                                <Badge key={resIndex} variant="outline">
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Career Paths */}
              <Card>
                <CardHeader>
                  <CardTitle>Alternative Career Paths</CardTitle>
                  <CardDescription>Explore different career directions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.careerPath.alternativePaths.map((path, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-foreground">{path.role}</h4>
                          <Badge className={path.match >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {path.match}% match
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Key skills needed:</p>
                          <div className="flex flex-wrap gap-2">
                            {path.requiredSkills.map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              {/* Short-term Learning Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Short-term Learning Plan (3-6 months)</CardTitle>
                  <CardDescription>Immediate skills to acquire</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.learningPlan.shortTerm.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <BookOpen className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{item.skill}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.resource}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{item.duration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{item.cost}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Long-term Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Long-term Certifications</CardTitle>
                  <CardDescription>Advanced credentials for career advancement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.learningPlan.longTerm.map((cert, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{cert.skill}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{cert.certification}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{cert.timeline}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Habits */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Learning Habits</CardTitle>
                  <CardDescription>Build consistent skill development routines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.learningPlan.dailyHabits.map((habit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm text-foreground">{habit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market" className="space-y-6">
              {/* Salary Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Skill Salary Impact
                  </CardTitle>
                  <CardDescription>How different skills affect earning potential</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.marketInsights.salaryImpact.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{skill.skill}</h4>
                          <p className="text-sm text-muted-foreground">{skill.demand} demand</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">{skill.salaryBoost}</p>
                          <p className="text-sm text-muted-foreground">salary boost</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Trending Skills</CardTitle>
                  <CardDescription>Emerging skills with high growth potential</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.marketInsights.trendingSkills.map((skill, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{skill.skill}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{skill.reason}</p>
                            <Badge className="mt-2 bg-green-100 text-green-800">
                              {skill.growth} growth
                            </Badge>
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


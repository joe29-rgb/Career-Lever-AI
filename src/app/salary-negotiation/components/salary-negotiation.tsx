'use client'

import { useState } from 'react'
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
  DollarSign,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calculator,
  MessageSquare,
  FileText,
  Award,
  Lightbulb
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SalaryAnalysis {
  marketData: {
    role: string
    location: string
    experience: string
    salaryRange: {
      min: number
      median: number
      max: number
      currency: string
    }
    percentiles: {
      p25: number
      p50: number
      p75: number
      p90: number
    }
  }
  negotiationStrategy: {
    targetSalary: number
    openingOffer: number
    counterOffer: number
    reasoning: string[]
  }
  leveragePoints: {
    experience: string[]
    skills: string[]
    marketDemand: string[]
    companyFactors: string[]
  }
  talkingPoints: {
    strengths: string[]
    valueProposition: string
    marketComparison: string
    growthPotential: string
  }
  redFlags: {
    warningSigns: string[]
    alternatives: string[]
    walkAwayPoints: string[]
  }
  preparationSteps: {
    research: string[]
    practice: string[]
    documentation: string[]
    followUp: string[]
  }
}

interface SalaryNegotiationProps {
  userId: string
}

export function SalaryNegotiation({ userId }: SalaryNegotiationProps) {
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    experience: '',
    currentSalary: ''
  })
  const [analysis, setAnalysis] = useState<SalaryAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('market')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateAnalysis = async () => {
    if (!formData.jobTitle || !formData.location) {
      toast.error('Please fill in job title and location')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/salary/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: formData.jobTitle,
          company: formData.company || undefined,
          location: formData.location,
          experience: formData.experience || 'mid',
          currentSalary: parseInt(formData.currentSalary) || 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      toast.success('Salary analysis completed!')
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Analysis
          </CardTitle>
          <CardDescription>
            Get market data and negotiation strategies for your target role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Software Engineer"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level</Label>
              <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="junior">Junior (2-3 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior (5-8 years)</SelectItem>
                  <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                  <SelectItem value="manager">Manager (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSalary">Current Salary (Optional)</Label>
              <Input
                id="currentSalary"
                type="number"
                placeholder="80000"
                value={formData.currentSalary}
                onChange={(e) => handleInputChange('currentSalary', e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={generateAnalysis}
            disabled={loading || !formData.jobTitle || !formData.location}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Salary Data...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate Salary Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Salary analysis completed for {analysis.marketData.role} in {analysis.marketData.location}
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="market">Market Data</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="leverage">Leverage</TabsTrigger>
              <TabsTrigger value="talking">Talking Points</TabsTrigger>
              <TabsTrigger value="preparation">Preparation</TabsTrigger>
            </TabsList>

            <TabsContent value="market" className="space-y-6">
              {/* Salary Range Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Salary Range Overview</CardTitle>
                  <CardDescription>
                    Market data for {analysis.marketData.role} in {analysis.marketData.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Salary Range Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Salary Range</span>
                        <span>{formatCurrency(analysis.marketData.salaryRange.min)} - {formatCurrency(analysis.marketData.salaryRange.max)}</span>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded-full">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                          style={{ width: '100%' }}
                        />
                        {/* Median marker */}
                        <div
                          className="absolute top-0 w-1 h-full bg-black"
                          style={{
                            left: `${((analysis.marketData.salaryRange.median - analysis.marketData.salaryRange.min) / (analysis.marketData.salaryRange.max - analysis.marketData.salaryRange.min)) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min</span>
                        <span className="font-medium">Median: {formatCurrency(analysis.marketData.salaryRange.median)}</span>
                        <span>Max</span>
                      </div>
                    </div>

                    {/* Percentiles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(analysis.marketData.percentiles.p25)}</div>
                        <div className="text-sm text-gray-600">25th Percentile</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{formatCurrency(analysis.marketData.percentiles.p50)}</div>
                        <div className="text-sm text-gray-600">50th Percentile (Median)</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{formatCurrency(analysis.marketData.percentiles.p75)}</div>
                        <div className="text-sm text-gray-600">75th Percentile</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{formatCurrency(analysis.marketData.percentiles.p90)}</div>
                        <div className="text-sm text-gray-600">90th Percentile</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Context</CardTitle>
                  <CardDescription>Understanding your position in the market</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-blue-900">Your Experience Level</h4>
                        <p className="text-sm text-blue-700">{analysis.marketData.experience} level professional</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {analysis.marketData.experience}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-green-900">Market Position</h4>
                        <p className="text-sm text-green-700">Your skills place you in the competitive range</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6">
              {/* Negotiation Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Negotiation Strategy
                  </CardTitle>
                  <CardDescription>Your personalized salary negotiation plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Salary Targets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-700 mb-1">Target Salary</div>
                        <div className="text-2xl font-bold text-green-800">{formatCurrency(analysis.negotiationStrategy.targetSalary)}</div>
                        <div className="text-xs text-green-600 mt-1">Your goal</div>
                      </div>

                      <div className="text-center p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-700 mb-1">Opening Offer</div>
                        <div className="text-2xl font-bold text-blue-800">{formatCurrency(analysis.negotiationStrategy.openingOffer)}</div>
                        <div className="text-xs text-blue-600 mt-1">What to ask for</div>
                      </div>

                      <div className="text-center p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
                        <div className="text-sm text-purple-700 mb-1">Counter Offer</div>
                        <div className="text-2xl font-bold text-purple-800">{formatCurrency(analysis.negotiationStrategy.counterOffer)}</div>
                        <div className="text-xs text-purple-600 mt-1">If they counter</div>
                      </div>
                    </div>

                    {/* Strategy Reasoning */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Strategy Rationale</h4>
                      <ul className="space-y-2">
                        {analysis.negotiationStrategy.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leverage" className="space-y-6">
              {/* Leverage Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Experience Leverage</CardTitle>
                    <CardDescription>Your professional background</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.leveragePoints.experience.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Award className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skills Leverage</CardTitle>
                    <CardDescription>Your technical competencies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.leveragePoints.skills.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Demand</CardTitle>
                    <CardDescription>External market factors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.leveragePoints.marketDemand.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Company Factors</CardTitle>
                    <CardDescription>Organization-specific advantages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.leveragePoints.companyFactors.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="talking" className="space-y-6">
              {/* Talking Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Key Talking Points
                  </CardTitle>
                  <CardDescription>Scripted responses for salary discussions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Value Proposition */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Your Value Proposition</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">{analysis.talkingPoints.valueProposition}</p>
                  </div>

                  {/* Market Comparison */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Market Comparison</h4>
                    <p className="text-sm text-green-800 leading-relaxed">{analysis.talkingPoints.marketComparison}</p>
                  </div>

                  {/* Growth Potential */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Growth Potential</h4>
                    <p className="text-sm text-purple-800 leading-relaxed">{analysis.talkingPoints.growthPotential}</p>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Your Key Strengths</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.talkingPoints.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preparation" className="space-y-6">
              {/* Red Flags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Red Flags & Walk-Away Points
                  </CardTitle>
                  <CardDescription>When to reconsider the offer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Warning Signs</h4>
                      <ul className="space-y-1">
                        {analysis.redFlags.warningSigns.map((sign, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-1">
                            <span className="text-red-500">•</span>
                            {sign}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Alternatives</h4>
                      <ul className="space-y-1">
                        {analysis.redFlags.alternatives.map((alt, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-1">
                            <span className="text-blue-500">•</span>
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Walk-Away Points</h4>
                      <ul className="space-y-1">
                        {analysis.redFlags.walkAwayPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-1">
                            <span className="text-orange-500">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preparation Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Research Phase</CardTitle>
                    <CardDescription>Gather information before negotiating</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {analysis.preparationSteps.research.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Practice Phase</CardTitle>
                    <CardDescription>Prepare your negotiation skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {analysis.preparationSteps.practice.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>Keep records of your negotiation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.preparationSteps.documentation.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Follow-Up</CardTitle>
                    <CardDescription>After the negotiation is complete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.preparationSteps.followUp.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}


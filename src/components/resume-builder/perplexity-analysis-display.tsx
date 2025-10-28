'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign, 
  Briefcase, 
  Target,
  CheckCircle,
  Lightbulb,
  BarChart3
} from 'lucide-react'

interface PerplexityAnalysisDisplayProps {
  analysis: {
    keywords: string[]
    location: {
      city: string
      province: string
      country: string
    }
    experienceLevel: string
    targetSalaryRange: {
      min: number
      max: number
      currency: string
      marketData: {
        percentile25: number
        percentile50: number
        percentile75: number
      }
    }
    targetJobTitles: string[]
    topSkills: Array<{
      skill: string
      yearsExperience: number
      proficiency: string
      marketDemand: string
      growthTrend: string
    }>
    futureOutlook: {
      aiReplacementRisk: string
      automationRisk: string
      fiveYearOutlook: string
      reasoning: string
      recommendations: string[]
    }
    careerPath: {
      currentLevel: string
      nextPossibleRoles: string[]
      timeToNextLevel: string
      skillsNeeded: string[]
    }
  }
}

export function PerplexityAnalysisDisplay({ analysis }: PerplexityAnalysisDisplayProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing':
      case 'hot':
      case 'thriving':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Salary Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Salary Insights
          </CardTitle>
          <CardDescription>
            Based on 2025 market data for {analysis.experienceLevel} level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ${analysis.targetSalaryRange.min.toLocaleString()} - ${analysis.targetSalaryRange.max.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{analysis.targetSalaryRange.currency}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>25th Percentile</span>
              <span className="font-medium">${analysis.targetSalaryRange.marketData.percentile25.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Median (50th)</span>
              <span className="font-medium">${analysis.targetSalaryRange.marketData.percentile50.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>75th Percentile</span>
              <span className="font-medium">${analysis.targetSalaryRange.marketData.percentile75.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Skills Analysis
          </CardTitle>
          <CardDescription>
            Your most valuable skills with market insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.topSkills.slice(0, 5).map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.skill}</span>
                    {getTrendIcon(skill.growthTrend)}
                  </div>
                  <Badge className={getDemandColor(skill.marketDemand)}>
                    {skill.marketDemand} demand
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{skill.yearsExperience} years</span>
                  <span>•</span>
                  <span className="capitalize">{skill.proficiency}</span>
                  <span>•</span>
                  <span className="capitalize">{skill.growthTrend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Outlook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Career Outlook (5 Years)
          </CardTitle>
          <CardDescription>
            AI/Automation impact and future predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border ${getRiskColor(analysis.futureOutlook.aiReplacementRisk)}`}>
              <p className="text-xs font-medium mb-1">AI Replacement Risk</p>
              <p className="text-lg font-bold capitalize">{analysis.futureOutlook.aiReplacementRisk}</p>
            </div>
            <div className={`p-3 rounded-lg border ${getRiskColor(analysis.futureOutlook.automationRisk)}`}>
              <p className="text-xs font-medium mb-1">Automation Risk</p>
              <p className="text-lg font-bold capitalize">{analysis.futureOutlook.automationRisk}</p>
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>5-Year Outlook:</strong> {analysis.futureOutlook.fiveYearOutlook}
              <p className="mt-2 text-sm">{analysis.futureOutlook.reasoning}</p>
            </AlertDescription>
          </Alert>

          {analysis.futureOutlook.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recommendations:</p>
              <ul className="space-y-1">
                {analysis.futureOutlook.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Path */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Career Path
          </CardTitle>
          <CardDescription>
            Next steps in your career progression
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current Level</p>
            <p className="font-medium">{analysis.careerPath.currentLevel}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Next Possible Roles</p>
            <div className="flex flex-wrap gap-2">
              {analysis.careerPath.nextPossibleRoles.map((role, index) => (
                <Badge key={index} variant="outline">{role}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Time to Next Level</p>
            <p className="font-medium">{analysis.careerPath.timeToNextLevel}</p>
          </div>

          {analysis.careerPath.skillsNeeded.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Skills Needed</p>
              <div className="flex flex-wrap gap-2">
                {analysis.careerPath.skillsNeeded.map((skill, index) => (
                  <Badge key={index} className="bg-primary/10 text-primary">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Job Titles */}
      <Card>
        <CardHeader>
          <CardTitle>Target Job Titles</CardTitle>
          <CardDescription>
            Roles that match your experience and skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.targetJobTitles.map((title, index) => (
              <Badge key={index} variant="secondary">{title}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Resume Keywords</CardTitle>
          <CardDescription>
            Key terms extracted from your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.slice(0, 20).map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">{keyword}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

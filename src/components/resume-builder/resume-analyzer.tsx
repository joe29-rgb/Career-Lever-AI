'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Circle } from 'lucide-react'

interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
    summary: string
  }
  experience: Array<any>
  education: Array<any>
  skills: {
    technical: string[]
    soft: string[]
    languages: Array<any>
    certifications: Array<any>
  }
  projects: Array<any>
}

interface ResumeAnalyzerProps {
  resumeData: ResumeData
}

interface AnalysisItem {
  label: string
  status: 'complete' | 'incomplete' | 'optional'
  weight: number
}

export function ResumeAnalyzer({ resumeData }: ResumeAnalyzerProps) {
  const analysis = useMemo(() => {
    const items: AnalysisItem[] = [
      {
        label: 'Personal Information',
        status: resumeData.personalInfo.fullName && 
                resumeData.personalInfo.email && 
                resumeData.personalInfo.phone && 
                resumeData.personalInfo.location 
          ? 'complete' 
          : 'incomplete',
        weight: 15
      },
      {
        label: 'Professional Summary',
        status: resumeData.personalInfo.summary && resumeData.personalInfo.summary.length >= 50
          ? 'complete'
          : 'incomplete',
        weight: 10
      },
      {
        label: 'Work Experience',
        status: resumeData.experience.length > 0
          ? 'complete'
          : 'incomplete',
        weight: 30
      },
      {
        label: 'Education',
        status: resumeData.education.length > 0
          ? 'complete'
          : 'incomplete',
        weight: 20
      },
      {
        label: 'Skills',
        status: (resumeData.skills.technical.length + resumeData.skills.soft.length) >= 5
          ? 'complete'
          : 'incomplete',
        weight: 15
      },
      {
        label: 'LinkedIn Profile',
        status: resumeData.personalInfo.linkedin
          ? 'complete'
          : 'optional',
        weight: 5
      },
      {
        label: 'Projects/Portfolio',
        status: resumeData.projects.length > 0
          ? 'complete'
          : 'optional',
        weight: 5
      }
    ]

    const completedWeight = items
      .filter(item => item.status === 'complete')
      .reduce((sum, item) => sum + item.weight, 0)

    const totalWeight = items
      .filter(item => item.status !== 'optional')
      .reduce((sum, item) => sum + item.weight, 0)

    const completeness = Math.round((completedWeight / totalWeight) * 100)

    return { items, completeness }
  }, [resumeData])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'incomplete':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'optional':
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getCompletenessLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Work'
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Resume Analysis</span>
          <Badge 
            variant="outline" 
            className={`${getCompletenessColor(analysis.completeness)} border-current`}
          >
            {getCompletenessLabel(analysis.completeness)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completeness Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Completeness</span>
            <span className={`text-2xl font-bold ${getCompletenessColor(analysis.completeness)}`}>
              {analysis.completeness}%
            </span>
          </div>
          <Progress value={analysis.completeness} className="h-2" />
        </div>

        {/* Section Checklist */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground mb-3">Sections</h4>
          {analysis.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className={`text-sm ${
                  item.status === 'complete' 
                    ? 'text-foreground' 
                    : item.status === 'optional'
                    ? 'text-muted-foreground'
                    : 'text-orange-600'
                }`}>
                  {item.label}
                </span>
              </div>
              {item.status === 'optional' && (
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        {analysis.completeness < 80 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
              💡 Quick Tips
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              {analysis.items
                .filter(item => item.status === 'incomplete')
                .slice(0, 2)
                .map((item, index) => (
                  <li key={index}>• Complete your {item.label.toLowerCase()}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

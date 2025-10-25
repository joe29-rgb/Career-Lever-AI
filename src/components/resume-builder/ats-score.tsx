'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react'

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

interface ATSScoreProps {
  resumeData: ResumeData
  selectedTemplate: string
}

interface ScoreItem {
  category: string
  score: number
  maxScore: number
  status: 'pass' | 'warning' | 'fail'
  feedback: string
}

export function ATSScore({ resumeData, selectedTemplate }: ATSScoreProps) {
  const analysis = useMemo(() => {
    const scores: ScoreItem[] = []

    // 1. Contact Information (15 points)
    let contactScore = 0
    if (resumeData.personalInfo.fullName) contactScore += 4
    if (resumeData.personalInfo.email && resumeData.personalInfo.email.includes('@')) contactScore += 4
    if (resumeData.personalInfo.phone) contactScore += 3
    if (resumeData.personalInfo.location) contactScore += 2
    if (resumeData.personalInfo.linkedin) contactScore += 2

    scores.push({
      category: 'Contact Information',
      score: contactScore,
      maxScore: 15,
      status: contactScore >= 12 ? 'pass' : contactScore >= 8 ? 'warning' : 'fail',
      feedback: contactScore >= 12 
        ? 'Complete contact information' 
        : 'Add missing contact details (LinkedIn, phone, or location)'
    })

    // 2. Professional Summary (10 points)
    let summaryScore = 0
    const summary = resumeData.personalInfo.summary || ''
    if (summary.length >= 50) summaryScore += 3
    if (summary.length >= 100) summaryScore += 3
    if (summary.length >= 150 && summary.length <= 300) summaryScore += 4

    scores.push({
      category: 'Professional Summary',
      score: summaryScore,
      maxScore: 10,
      status: summaryScore >= 8 ? 'pass' : summaryScore >= 5 ? 'warning' : 'fail',
      feedback: summaryScore >= 8
        ? 'Strong professional summary'
        : summary.length < 50
        ? 'Summary too short (aim for 100-250 words)'
        : summary.length > 300
        ? 'Summary too long (keep it under 250 words)'
        : 'Expand your summary with key achievements'
    })

    // 3. Work Experience (30 points)
    let experienceScore = 0
    const hasExperience = resumeData.experience.length > 0
    if (hasExperience) experienceScore += 10

    const experienceWithBullets = resumeData.experience.filter(exp => 
      exp.achievements && exp.achievements.length >= 3
    ).length
    experienceScore += Math.min(experienceWithBullets * 5, 15)

    const experienceWithQuantifiableResults = resumeData.experience.filter(exp =>
      exp.description && /\d+%|\$\d+|[0-9]+ (users|clients|projects|team)/i.test(exp.description)
    ).length
    experienceScore += Math.min(experienceWithQuantifiableResults * 5, 5)

    scores.push({
      category: 'Work Experience',
      score: experienceScore,
      maxScore: 30,
      status: experienceScore >= 24 ? 'pass' : experienceScore >= 15 ? 'warning' : 'fail',
      feedback: experienceScore >= 24
        ? 'Excellent work experience section'
        : experienceWithBullets === 0
        ? 'Add bullet points with achievements for each role'
        : experienceWithQuantifiableResults === 0
        ? 'Add quantifiable results (numbers, percentages, metrics)'
        : 'Expand achievements with more specific details'
    })

    // 4. Education (15 points)
    let educationScore = 0
    if (resumeData.education.length > 0) educationScore += 10
    const educationWithDetails = resumeData.education.filter(edu =>
      edu.degree && edu.institution && edu.graduationDate
    ).length
    educationScore += Math.min(educationWithDetails * 5, 5)

    scores.push({
      category: 'Education',
      score: educationScore,
      maxScore: 15,
      status: educationScore >= 12 ? 'pass' : educationScore >= 8 ? 'warning' : 'fail',
      feedback: educationScore >= 12
        ? 'Complete education information'
        : 'Add degree, institution, and graduation date'
    })

    // 5. Skills (20 points)
    let skillsScore = 0
    const totalSkills = resumeData.skills.technical.length + resumeData.skills.soft.length
    if (totalSkills >= 5) skillsScore += 8
    if (totalSkills >= 10) skillsScore += 6
    if (totalSkills >= 15) skillsScore += 6

    scores.push({
      category: 'Skills',
      score: skillsScore,
      maxScore: 20,
      status: skillsScore >= 16 ? 'pass' : skillsScore >= 10 ? 'warning' : 'fail',
      feedback: skillsScore >= 16
        ? 'Comprehensive skills list'
        : totalSkills < 5
        ? 'Add at least 10-15 relevant skills'
        : 'Add more industry-specific skills'
    })

    // 6. Formatting & ATS Compatibility (10 points)
    let formatScore = 0
    // Simple templates score higher for ATS
    if (['minimal', 'professional'].includes(selectedTemplate)) formatScore += 5
    else if (['modern', 'tech'].includes(selectedTemplate)) formatScore += 4
    else formatScore += 3

    // Check for good formatting practices
    const hasConsistentDates = resumeData.experience.every(exp => exp.startDate && exp.endDate)
    if (hasConsistentDates) formatScore += 3

    const hasNoSpecialChars = !resumeData.personalInfo.fullName.match(/[^a-zA-Z\s\-\']/g)
    if (hasNoSpecialChars) formatScore += 2

    scores.push({
      category: 'ATS Compatibility',
      score: formatScore,
      maxScore: 10,
      status: formatScore >= 8 ? 'pass' : formatScore >= 5 ? 'warning' : 'fail',
      feedback: formatScore >= 8
        ? 'Excellent ATS compatibility'
        : !hasConsistentDates
        ? 'Ensure all dates are filled in consistently'
        : 'Consider using a simpler template for better ATS parsing'
    })

    const totalScore = scores.reduce((sum, item) => sum + item.score, 0)
    const maxTotalScore = scores.reduce((sum, item) => sum + item.maxScore, 0)
    const percentage = Math.round((totalScore / maxTotalScore) * 100)

    return { scores, totalScore, maxTotalScore, percentage }
  }, [resumeData, selectedTemplate])

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent'
    if (percentage >= 80) return 'Very Good'
    if (percentage >= 70) return 'Good'
    if (percentage >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />
    }
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            ATS Score
          </span>
          <Badge 
            variant="outline" 
            className={`${getScoreColor(analysis.percentage)} border-current text-lg px-3 py-1`}
          >
            {analysis.percentage}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall ATS Compatibility</span>
            <span className={`text-sm font-bold ${getScoreColor(analysis.percentage)}`}>
              {getScoreLabel(analysis.percentage)}
            </span>
          </div>
          <Progress value={analysis.percentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {analysis.totalScore} / {analysis.maxTotalScore} points
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Category Breakdown</h4>
          {analysis.scores.map((item, index) => (
            <div
              key={index}
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-medium text-foreground">{item.category}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.score}/{item.maxScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    item.status === 'pass' 
                      ? 'bg-green-500' 
                      : item.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{item.feedback}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        {analysis.percentage < 80 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
              💡 Quick Wins to Improve Score:
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              {analysis.scores
                .filter(item => item.status !== 'pass')
                .slice(0, 3)
                .map((item, index) => (
                  <li key={index}>• {item.feedback}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

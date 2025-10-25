'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy, Check, Lightbulb, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface AISuggestionsProps {
  section: 'summary' | 'experience' | 'skills' | 'achievements'
  context?: {
    jobTitle?: string
    industry?: string
    yearsExperience?: number
    currentText?: string
  }
}

export function AISuggestions({ section, context = {} }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const getSuggestions = () => {
    setIsLoading(true)
    
    // Simulate AI suggestions (in production, this would call your AI API)
    setTimeout(() => {
      const mockSuggestions = generateMockSuggestions(section, context)
      setSuggestions(mockSuggestions)
      setIsLoading(false)
    }, 1000)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const generateMockSuggestions = (
    section: string,
    context: any
  ): string[] => {
    switch (section) {
      case 'summary':
        return [
          `Results-driven ${context.jobTitle || 'professional'} with ${context.yearsExperience || 5}+ years of experience in ${context.industry || 'technology'}. Proven track record of delivering high-impact solutions and driving business growth through innovative strategies and cross-functional collaboration.`,
          `Accomplished ${context.jobTitle || 'professional'} specializing in ${context.industry || 'technology'} with expertise in strategic planning, team leadership, and process optimization. Known for exceeding targets and implementing solutions that improve efficiency by 30%+.`,
          `Dynamic ${context.jobTitle || 'professional'} with a passion for ${context.industry || 'innovation'}. Combines technical expertise with business acumen to deliver measurable results. Skilled in stakeholder management, project delivery, and continuous improvement.`
        ]
      
      case 'experience':
        return [
          'Led cross-functional team of 12 engineers to deliver enterprise-scale platform, resulting in 40% increase in user engagement and $2M annual revenue growth',
          'Spearheaded implementation of agile methodologies across 5 departments, reducing project delivery time by 35% and improving team productivity by 50%',
          'Architected and deployed cloud-native microservices infrastructure serving 10M+ daily active users with 99.99% uptime',
          'Mentored 8 junior developers, establishing coding standards and best practices that reduced bug rate by 60%',
          'Collaborated with C-suite executives to define product roadmap, securing $5M in additional funding for strategic initiatives'
        ]
      
      case 'skills':
        return [
          'Technical Skills: Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, MongoDB',
          'Soft Skills: Leadership, Strategic Planning, Cross-functional Collaboration, Stakeholder Management, Agile/Scrum',
          'Industry Skills: Cloud Architecture, DevOps, CI/CD, Microservices, API Design, System Design',
          'Tools & Platforms: Git, JIRA, Confluence, Slack, Figma, Tableau, Salesforce'
        ]
      
      case 'achievements':
        return [
          'Increased system performance by 250% through database optimization and caching strategies',
          'Reduced operational costs by $500K annually by migrating legacy systems to cloud infrastructure',
          'Achieved 98% customer satisfaction score through implementation of automated support systems',
          'Grew user base from 100K to 1M+ users in 12 months through strategic product enhancements',
          'Received "Employee of the Year" award for exceptional contributions to company growth'
        ]
      
      default:
        return []
    }
  }

  const getSectionTitle = () => {
    switch (section) {
      case 'summary':
        return 'Professional Summary Suggestions'
      case 'experience':
        return 'Achievement Bullet Points'
      case 'skills':
        return 'Skills Suggestions'
      case 'achievements':
        return 'Quantifiable Achievements'
      default:
        return 'AI Suggestions'
    }
  }

  const getSectionIcon = () => {
    switch (section) {
      case 'summary':
        return <Lightbulb className="w-5 h-5" />
      case 'experience':
      case 'achievements':
        return <TrendingUp className="w-5 h-5" />
      case 'skills':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getSectionIcon()}
            {getSectionTitle()}
          </span>
          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get AI-powered suggestions tailored to your role and industry
            </p>
            <Button
              onClick={getSuggestions}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground flex-1 leading-relaxed">
                      {suggestion}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(suggestion, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={getSuggestions}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isLoading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate More
              </Button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Click the copy icon to add suggestions to your resume. Customize them to match your specific experience!
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  FileText,
  Search,
  Users,
  BarChart3,
  Plus,
  ArrowRight
} from 'lucide-react'

const quickActions = [
  {
    title: 'Career Finder',
    description: 'Start the complete AI-powered job application workflow',
    icon: Upload,
    href: '/career-finder/resume',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    primary: true,
  },
  {
    title: 'Upload Resume',
    description: 'Upload and parse your resume for customization',
    icon: Upload,
    href: '/career-finder/resume',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Find Jobs',
    description: 'Search for jobs with AI-powered matching',
    icon: Search,
    href: '/career-finder/search',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Optimize Resume',
    description: 'Tailor your resume for a specific job',
    icon: FileText,
    href: '/career-finder/optimizer',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Research Company',
    description: 'Get insights about a potential employer',
    icon: Users,
    href: '/career-finder/company',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Generate Cover Letter',
    description: 'Create a personalized cover letter',
    icon: FileText,
    href: '/cover-letter',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    title: 'View Applications',
    description: 'Track and manage your job applications',
    icon: BarChart3,
    href: '/analytics',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Get started with common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Action */}
          {quickActions.filter(action => action.primary).map((action, index) => (
            <Button
              key={index}
              size="lg"
              className="w-full h-auto p-6 flex items-center gap-4 hover:shadow-lg transition-all text-left no-text-bleed"
              onClick={() => router.push(action.href)}
            >
              <div className={`rounded-lg p-3 ${action.bgColor}`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg text-foreground dark:text-gray-100 line-clamp-1">{action.title}</div>
                <div className="text-sm text-muted-foreground dark:text-gray-300 mt-1 line-clamp-2">
                  {action.description}
                </div>
              </div>
              <ArrowRight className="ml-auto h-5 w-5" />
            </Button>
          ))}

          {/* Secondary Actions */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.filter(action => !action.primary).map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="min-h-[140px] p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left no-text-bleed whitespace-pre-wrap break-words"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`rounded-lg p-2 ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-foreground dark:text-gray-100 leading-normal">{action.title}</div>
                    <div className="text-xs text-muted-foreground dark:text-gray-300 mt-1 leading-normal">
                      {action.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


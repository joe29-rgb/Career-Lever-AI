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
    title: 'Create Application',
    description: 'Start the complete AI-powered application workflow',
    icon: Upload,
    href: '/create-application',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    primary: true,
  },
  {
    title: 'Upload Resume',
    description: 'Upload and parse your resume for customization',
    icon: Upload,
    href: '/create-application?step=upload',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Analyze Job',
    description: 'Paste a job description for AI analysis',
    icon: Search,
    href: '/create-application?step=analyze',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Customize Resume',
    description: 'Tailor your resume for a specific job',
    icon: FileText,
    href: '/create-application?step=customize',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Research Company',
    description: 'Get insights about a potential employer',
    icon: Users,
    href: '/create-application?step=research',
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
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-gray-600">
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
              className="w-full h-auto p-6 flex items-center gap-4 hover:shadow-lg transition-all"
              onClick={() => router.push(action.href)}
            >
              <div className={`rounded-lg p-3 ${action.bgColor}`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg text-gray-900">{action.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {action.description}
                </div>
              </div>
              <ArrowRight className="ml-auto h-5 w-5" />
            </Button>
          ))}

          {/* Secondary Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.filter(action => !action.primary).map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`rounded-lg p-2 ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-gray-900">{action.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
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

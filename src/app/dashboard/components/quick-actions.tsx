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
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react'

const quickActions = [
  {
    title: 'Career Finder',
    description: 'Start the complete AI-powered job application workflow',
    icon: Sparkles,
    href: '/career-finder/resume',
    gradient: 'from-blue-600 via-purple-600 to-pink-600',
    bgGradient: 'from-blue-500/10 via-purple-500/10 to-pink-500/10',
    primary: true,
  },
  {
    title: 'Upload Resume',
    description: 'Upload and parse your resume for customization',
    icon: Upload,
    href: '/career-finder/resume',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    title: 'Find Jobs',
    description: 'Search for jobs with AI-powered matching',
    icon: Search,
    href: '/career-finder/search',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
  },
  {
    title: 'Optimize Resume',
    description: 'Tailor your resume for a specific job',
    icon: Zap,
    href: '/career-finder/optimizer',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
  },
  {
    title: 'Research Company',
    description: 'Get insights about a potential employer',
    icon: Users,
    href: '/career-finder/company',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
  },
  {
    title: 'Generate Cover Letter',
    description: 'Create a personalized cover letter',
    icon: FileText,
    href: '/cover-letter',
    gradient: 'from-red-500 to-pink-500',
    bgGradient: 'from-red-500/10 to-pink-500/10',
  },
  {
    title: 'View Applications',
    description: 'Track and manage your job applications',
    icon: BarChart3,
    href: '/analytics',
    gradient: 'from-teal-500 to-cyan-500',
    bgGradient: 'from-teal-500/10 to-cyan-500/10',
  },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <Card className="border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Get started with common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Action - Featured Card */}
          {quickActions.filter(action => action.primary).map((action, index) => (
            <div
              key={index}
              onClick={() => router.push(action.href)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
              
              {/* Content */}
              <div className="relative p-6 flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-card/20 backdrop-blur-sm flex items-center justify-center">
                  <action.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{action.title}</h3>
                  <p className="text-sm text-white/90">{action.description}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}

          {/* Secondary Actions - Grid */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Quick Tools
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.filter(action => !action.primary).map((action, index) => (
                <div
                  key={index}
                  onClick={() => router.push(action.href)}
                  className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/[0.05]"
                >
                  {/* Hover Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative p-5 flex flex-col h-full min-h-[140px]">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} mb-3 shadow-lg`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 leading-tight">{action.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {action.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Get started</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  Zap,
  Users,
  BarChart3,
  Mail,
  Shield,
  Clock
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'AI Resume Customization',
    description: 'Upload your resume and let AI tailor it to specific job descriptions. Our system analyzes keywords, optimizes for ATS, and highlights relevant experience.',
    badge: 'Most Popular',
    color: 'text-blue-600',
  },
  {
    icon: Search,
    title: 'Intelligent Job Analysis',
    description: 'Paste any job description and get instant analysis of key requirements, preferred skills, and company culture indicators.',
    badge: null,
    color: 'text-green-600',
  },
  {
    icon: Users,
    title: 'Company Research Hub',
    description: 'Get comprehensive company insights from LinkedIn, Glassdoor, and social media. Understand culture, benefits, and recent developments.',
    badge: 'New',
    color: 'text-purple-600',
  },
  {
    icon: Mail,
    title: 'Cover Letter Generation',
    description: 'AI-crafted cover letters that incorporate company research and demonstrate genuine interest in the role and organization.',
    badge: null,
    color: 'text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Application Tracking',
    description: 'Track all your job applications in one place. Monitor status, set follow-up reminders, and analyze your job search progress.',
    badge: null,
    color: 'text-red-600',
  },
  {
    icon: Zap,
    title: 'Follow-up Automation',
    description: 'Generate personalized follow-up emails and LinkedIn messages. Never miss an opportunity to stay top-of-mind with employers.',
    badge: 'Pro',
    color: 'text-yellow-600',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Your data is encrypted and secure. We never share your information with employers or third parties.',
    badge: null,
    color: 'text-indigo-600',
  },
  {
    icon: Clock,
    title: 'Time-Saving Workflow',
    description: 'Streamlined process from resume upload to application submission. Spend less time on applications, more time on interviews.',
    badge: null,
    color: 'text-teal-600',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to land your dream job
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Our AI-powered platform provides comprehensive tools to optimize every aspect of your job search.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-3 ${feature.color.replace('text-', 'bg-').replace('600', '100')}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}




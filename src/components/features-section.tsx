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
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ background: 'var(--color-bg-1)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: 'var(--color-bg-3)' }} />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* BEFORE/AFTER METRICS - REDESIGNED! */}
        <div className="mx-auto max-w-4xl mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2" style={{ color: 'var(--color-text)' }}>
              Real Results from Real Job Seekers
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              See the dramatic difference Career Lever AI makes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* WITHOUT Career Lever AI */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <span className="text-3xl">😓</span>
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">Without Career Lever AI</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-3">❌</span>
                  <div>
                    <div className="font-semibold text-foreground">50+ applications = 2 interviews</div>
                    <div className="text-sm text-gray-600">4% response rate</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-3">❌</span>
                  <div>
                    <div className="font-semibold text-foreground">4 hours per application</div>
                    <div className="text-sm text-gray-600">200+ hours wasted</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-3">❌</span>
                  <div>
                    <div className="font-semibold text-foreground">Generic resumes ignored</div>
                    <div className="text-sm text-gray-600">15% ATS pass rate</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 font-bold mr-3">❌</span>
                  <div>
                    <div className="font-semibold text-foreground">Missed follow-ups</div>
                    <div className="text-sm text-gray-600">Lost opportunities</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* WITH Career Lever AI */}
            <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white px-4 py-1 text-sm font-bold">
                  85% SUCCESS RATE
                </Badge>
              </div>
              <div className="text-center mb-6 mt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">With Career Lever AI</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✅</span>
                  <div>
                    <div className="font-semibold text-foreground">15 applications = 8 interviews</div>
                    <div className="text-sm text-gray-600">53% response rate (13x better!)</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✅</span>
                  <div>
                    <div className="font-semibold text-foreground">20 minutes per application</div>
                    <div className="text-sm text-gray-600">5 hours total (12x faster!)</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✅</span>
                  <div>
                    <div className="font-semibold text-foreground">ATS-optimized resumes</div>
                    <div className="text-sm text-gray-600">85% ATS pass rate (5.6x better!)</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✅</span>
                  <div>
                    <div className="font-semibold text-foreground">Automated follow-ups</div>
                    <div className="text-sm text-gray-600">Never miss opportunities</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-text)' }}>
            Everything you need to land your dream job
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Our AI-powered platform provides comprehensive tools to optimize every aspect of your job search.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden border-0 transition-all duration-300 hover:-translate-y-2 group"
              style={{ 
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: 'var(--color-primary)' }} />
              
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div 
                    className="rounded-lg p-3 transition-transform duration-300 group-hover:scale-110" 
                    style={{ background: `rgba(var(--color-teal-500-rgb), 0.1)` }}
                  >
                    <feature.icon className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  {feature.badge && (
                    <Badge 
                      className="text-xs font-semibold px-3 py-1"
                      style={{ 
                        background: 'var(--color-primary)',
                        color: 'var(--color-btn-primary-text)'
                      }}
                    >
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl mt-4" style={{ color: 'var(--color-text)' }}>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MOBILE APP FEATURES - REDESIGNED! */}
        <div className="mx-auto max-w-4xl mt-32">
          <div className="text-center mb-12">
            <Badge 
              className="px-4 py-1 mb-4 text-sm font-semibold"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-teal-400))',
                color: 'var(--color-btn-primary-text)'
              }}
            >
              📱 Mobile Apps
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4" style={{ color: 'var(--color-text)' }}>
              Job Search on the Go
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Apply to jobs from anywhere with our powerful mobile apps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '📸', title: 'Scan Job Postings', desc: 'Take a photo of any job posting and instantly apply with AI-optimized resume', bg: 'var(--color-bg-1)' },
              { emoji: '🔔', title: 'Push Notifications', desc: 'Get instant alerts for interview prep, follow-ups, and application updates', bg: 'var(--color-bg-5)' },
              { emoji: '📍', title: 'Location-Based Jobs', desc: 'Find and apply to local opportunities while commuting or traveling', bg: 'var(--color-bg-3)' },
              { emoji: '💾', title: 'Offline Mode', desc: 'Edit resumes and prepare applications even without internet connection', bg: 'var(--color-bg-6)' }
            ].map((item, i) => (
              <Card 
                key={i}
                className="border-0 hover:-translate-y-1 transition-all duration-300 group"
                style={{ 
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <CardContent className="p-6 text-center">
                  <div 
                    className="text-4xl mb-4 inline-block p-4 rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{ background: item.bg }}
                  >
                    {item.emoji}
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* PRICING PREVIEW - REDESIGNED! */}
        <div className="mx-auto max-w-5xl mt-32 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4" style={{ color: 'var(--color-text)' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Start free, upgrade when you&apos;re ready
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FREE TIER */}
            <Card 
              className="border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ 
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '2px solid var(--color-border)'
              }}
            >
              <CardHeader className="pb-4" style={{ background: 'rgba(var(--color-teal-500-rgb), 0.05)' }}>
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2" style={{ color: 'var(--color-text)' }}>Free Forever</CardTitle>
                  <div className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>$0</div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Perfect for getting started</p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {['3 AI resume customizations per month', '10 company research reports', 'Basic application tracking', 'ATS optimization', 'Job search tools'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2" style={{ color: 'var(--color-success)' }}>✅</span>
                      <span style={{ color: 'var(--color-text)' }}><strong>{item}</strong></span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* PRO TIER */}
            <Card 
              className="border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative"
              style={{ 
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 40px rgba(var(--color-teal-500-rgb), 0.3)',
                border: '2px solid var(--color-primary)'
              }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge 
                  className="px-6 py-2 text-sm font-bold"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-teal-400))',
                    color: 'var(--color-btn-primary-text)'
                  }}
                >
                  🔥 MOST POPULAR
                </Badge>
              </div>
              <CardHeader 
                className="pb-4 pt-8"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(var(--color-teal-500-rgb), 0.1), rgba(var(--color-teal-300-rgb), 0.05))'
                }}
              >
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2" style={{ color: 'var(--color-text)' }}>Pro</CardTitle>
                  <div className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
                    $9.99<span className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>/mo</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Land your dream job faster</p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {['Unlimited AI customizations', 'Unlimited company research', 'Priority ATS optimization', 'LinkedIn integration', 'Advanced analytics', 'Interview prep AI', 'Priority support'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2" style={{ color: 'var(--color-primary)' }}>⚡</span>
                      <span style={{ color: 'var(--color-text)' }}><strong>{item}</strong></span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}











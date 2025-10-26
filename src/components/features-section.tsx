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
    <section className="py-24 bg-[#2B2B2B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* BEFORE/AFTER METRICS - NEW! */}
        <div className="mx-auto max-w-4xl mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-2">
              Real Results from Real Job Seekers
            </h2>
            <p className="text-lg text-white/70">
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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

        {/* MOBILE APP FEATURES - NEW! */}
        <div className="mx-auto max-w-4xl mt-32">
          <div className="text-center mb-12">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 mb-4">
              📱 Mobile Apps
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Job Search on the Go
            </h2>
            <p className="text-lg text-gray-600">
              Apply to jobs from anywhere with our powerful mobile apps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="font-bold text-foreground mb-2">Scan Job Postings</h3>
                <p className="text-sm text-gray-600">Take a photo of any job posting and instantly apply with AI-optimized resume</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="font-bold text-foreground mb-2">Push Notifications</h3>
                <p className="text-sm text-gray-600">Get instant alerts for interview prep, follow-ups, and application updates</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="font-bold text-foreground mb-2">Location-Based Jobs</h3>
                <p className="text-sm text-gray-600">Find and apply to local opportunities while commuting or traveling</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-100 hover:border-orange-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">💾</div>
                <h3 className="font-bold text-foreground mb-2">Offline Mode</h3>
                <p className="text-sm text-gray-600">Edit resumes and prepare applications even without internet connection</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PRICING PREVIEW - NEW! */}
        <div className="mx-auto max-w-5xl mt-32 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start free, upgrade when you're ready
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FREE TIER */}
            <Card className="border-2 border-border hover:shadow-xl transition-all">
              <CardHeader className="bg-gray-50 pb-4">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">Free Forever</CardTitle>
                  <div className="text-4xl font-bold text-foreground mb-2">$0</div>
                  <p className="text-sm text-gray-600">Perfect for getting started</p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-gray-700"><strong>3 AI resume customizations</strong> per month</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-gray-700"><strong>10 company research reports</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-gray-700"><strong>Basic application tracking</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-gray-700"><strong>ATS optimization</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-gray-700"><strong>Job search tools</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* PRO TIER */}
            <Card className="border-2 border-blue-400 hover:shadow-2xl transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-bold">
                  🔥 MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 pb-4 pt-8">
                <div className="text-center">
                  <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 mb-2">$9.99<span className="text-lg text-gray-600">/mo</span></div>
                  <p className="text-sm text-gray-600">Land your dream job faster</p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>Unlimited AI customizations</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>Unlimited company research</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>Priority ATS optimization</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>LinkedIn integration</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>Advanced analytics</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>Interview prep AI</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">⚡</span>
                    <span className="text-gray-700"><strong>Priority support</strong></span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}











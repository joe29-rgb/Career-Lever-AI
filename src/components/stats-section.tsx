'use client'

import { Card, CardContent } from '@/components/ui/card'

const stats = [
  {
    number: '10,000+',
    label: 'Job Seekers',
    description: 'Active users landing jobs',
  },
  {
    number: '85%',
    label: 'Success Rate',
    description: 'Users get interviews within 30 days',
  },
  {
    number: '50+',
    label: 'Hours Saved',
    description: 'Per job application on average',
  },
  {
    number: '500+',
    label: 'Companies',
    description: 'In our research database',
  },
]

export function StatsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trusted by job seekers worldwide
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of professionals who've transformed their job search with Career Lever AI.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="text-4xl font-bold text-blue-600 sm:text-5xl">
                  {stat.number}
                </div>
                <div className="mt-4 text-lg font-semibold text-gray-900">
                  {stat.label}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <blockquote className="text-lg font-medium text-gray-900">
            "Career Lever AI completely transformed my job search. I went from getting no responses to having multiple interviews within two weeks. The AI resume customization is incredible!"
          </blockquote>
          <div className="mt-6">
            <div className="font-semibold text-gray-900">Sarah Johnson</div>
            <div className="text-sm text-gray-600">Software Engineer at Google</div>
          </div>
        </div>
      </div>
    </section>
  )
}


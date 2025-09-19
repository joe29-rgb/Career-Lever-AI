'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Target, Zap, Users } from 'lucide-react'

export function HeroSection() {
  const [email, setEmail] = useState('')

  const handleGetStarted = async () => {
    // Send users to dedicated auth page with their email prefilled
    const callbackUrl = encodeURIComponent('/dashboard')
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const target = `${base}/auth/signin?callbackUrl=${encodeURIComponent(`${base}/dashboard`)}${email ? `&email=${encodeURIComponent(email)}` : ''}`
    window.location.href = target
  }

  const handleGoogle = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {}
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        {/* Top Nav with brand + auth actions (visible on all viewports) */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon-192.svg" alt="Career Lever AI" className="h-8 w-8" />
              <span className="text-white font-semibold text-lg">Career Lever AI</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/auth/signin${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="text-white/90 hover:text-white text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href={`/auth/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="inline-flex items-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-8 bg-white/10 text-white hover:bg-white/20">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Job Application Assistant
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            <span className="block">Career Lever AI</span>
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Land Your Dream Job with AI-Powered Tools
            </span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
            Customize your resume and cover letters with AI, research companies instantly,
            and track your applications—all in one powerful platform designed for job seekers.
          </p>

          {/* CTA Section */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
              />
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Get Started
              </Button>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleGoogle}
                size="lg"
                className="w-full bg-white/90 text-blue-700 hover:bg-white"
              >
                Continue with Google
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <Link href={`/auth/signin${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-blue-100 hover:text-white underline">
                Sign in
              </Link>
              <span className="text-blue-200">or</span>
              <Link href={`/auth/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-blue-100 hover:text-white underline">
                Create an account
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-200">
              Join 10,000+ job seekers who've landed their dream roles
            </p>
          </div>

          {/* Feature Cards */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Target className="mx-auto h-8 w-8 text-yellow-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">Smart Resume Tailoring</h3>
                <p className="mt-2 text-sm text-blue-100">
                  AI analyzes job descriptions and optimizes your resume for ATS systems
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Zap className="mx-auto h-8 w-8 text-yellow-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">Instant Company Research</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Get company insights from LinkedIn, Glassdoor, and social media
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto h-8 w-8 text-yellow-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">Application Tracking</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Track all your applications and follow-ups in one dashboard
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}


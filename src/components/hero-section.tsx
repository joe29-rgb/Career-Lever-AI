'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
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
                className="btn btn-secondary text-white border-white/20 hover:bg-card/20"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="badge badge-accent mb-8 bg-white/10 text-white hover:bg-card/20">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Job Application Assistant
          </div>

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

          {/* APP STORE BADGES - NEW! */}
          <div className="mx-auto mt-10 flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Download on Your Platform
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {/* App Store Badge */}
              <a 
                href="#" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-black rounded-xl hover:bg-gray-800 transition-all hover:scale-105"
                aria-label="Download on App Store"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-white/70">Download on the</div>
                  <div className="text-sm font-semibold text-white">App Store</div>
                </div>
              </a>

              {/* Google Play Badge */}
              <a 
                href="#" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-black rounded-xl hover:bg-gray-800 transition-all hover:scale-105"
                aria-label="Get it on Google Play"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-white/70">GET IT ON</div>
                  <div className="text-sm font-semibold text-white">Google Play</div>
                </div>
              </a>

              {/* Microsoft Store Badge */}
              <a 
                href="#" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-black rounded-xl hover:bg-gray-800 transition-all hover:scale-105"
                aria-label="Get it from Microsoft"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5,3L2,5.5V11H11.5V3M22,3L12.5,5.5V11H22V3M11.5,13H2V18.5L11.5,21V13M12.5,13V21L22,18.5V13H12.5Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-white/70">Get it from</div>
                  <div className="text-sm font-semibold text-white">Microsoft</div>
                </div>
              </a>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="text-center mb-6">
              <p className="text-sm text-white/70 uppercase tracking-wider font-semibold mb-4">
                Or Sign Up on Web
              </p>
            </div>
            
            {/* SSO Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoogle}
                className="btn btn-secondary w-full bg-card text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => signIn('apple', { callbackUrl: '/dashboard' })}
                className="btn w-full bg-black text-white hover:bg-gray-900 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </button>

              <button
                onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
                className="btn w-full bg-[#00A4EF] text-white hover:bg-[#008BCF] flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5,3L2,5.5V11H11.5V3M22,3L12.5,5.5V11H22V3M11.5,13H2V18.5L11.5,21V13M12.5,13V21L22,18.5V13H12.5Z"/>
                </svg>
                Continue with Microsoft
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link href={`/auth/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-sm text-blue-100 hover:text-white underline">
                Or sign up with email
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-blue-200">
              🚀 Join 10,000+ job seekers who've landed their dream roles
            </p>
          </div>

          {/* Feature Cards */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="card bg-card/10 border-white/20 backdrop-blur-sm">
              <div className="text-center">
                <Target className="mx-auto h-8 w-8 text-yellow-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">Smart Resume Tailoring</h3>
                <p className="mt-2 text-sm text-blue-100">
                  AI analyzes job descriptions and optimizes your resume for ATS systems
                </p>
              </div>
            </div>

            <div className="card bg-card/10 border-white/20 backdrop-blur-sm">
              <div className="text-center">
                <Zap className="mx-auto h-8 w-8 text-yellow-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">Instant Company Research</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Get company insights from LinkedIn, Glassdoor, and social media
                </p>
              </div>
            </div>

            <div className="card bg-card/10 border-white/20 backdrop-blur-sm">
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-yellow-400" />
                <h3 className="mt-4 text-sm font-semibold text-white">Application Tracking</h3>
                <p className="mt-2 text-sm text-blue-100">
                  Track all your applications and follow-ups in one dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


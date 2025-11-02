'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

// Company logos data for floating pills - MORE RECOGNIZABLE COMPANIES
const COMPANY_PILLS = [
  { name: 'Netflix', logo: '📺', color: '#E50914', delay: 0 },
  { name: 'Amazon', logo: '📦', color: '#FF9900', delay: 0.5 },
  { name: 'Spotify', logo: '🎵', color: '#1DB954', delay: 1 },
  { name: 'LinkedIn', logo: '💼', color: '#0077B5', delay: 1.5 },
  { name: 'Uber', logo: '🚗', color: '#000000', delay: 2 },
  { name: 'Airbnb', logo: '🏠', color: '#FF5A5F', delay: 2.5 },
  { name: 'Meta', logo: '📘', color: '#0075FF', delay: 3 },
  { name: 'Google', logo: '🔍', color: '#FFFFFF', delay: 3.5, textColor: '#000000' },
  { name: 'Apple', logo: '🍎', color: '#FFFFFF', delay: 4, textColor: '#000000' },
  { name: 'Tesla', logo: '⚡', color: '#E82127', delay: 4.5 },
  { name: 'Goldman', logo: '💰', color: '#1F1F1F', delay: 5, textColor: '#FFFFFF' },
  { name: 'PepsiCo', logo: '🥤', color: 'linear-gradient(135deg, #004B93 0%, #E32934 100%)', delay: 5.5 },
]

// Pill positions (scattered layout) - MORE POSITIONS FOR MORE COMPANIES
const PILL_POSITIONS = [
  { top: '20%', left: '5%', rotation: -8 },
  { top: '25%', right: '10%', rotation: 5 },
  { top: '40%', left: '12%', rotation: -3 },
  { bottom: '40%', left: '3%', rotation: 7 },
  { top: '50%', right: '6%', rotation: -5 },
  { bottom: '30%', left: '15%', rotation: 4 },
  { bottom: '35%', right: '12%', rotation: -6 },
  { top: '60%', left: '20%', rotation: 3 },
  { bottom: '50%', right: '3%', rotation: -4 },
  { top: '70%', right: '18%', rotation: 6 },
  { bottom: '20%', left: '25%', rotation: -7 },
  { top: '35%', right: '25%', rotation: 8 },
]

export function HeroSectionV2() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGetStarted = async () => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const target = `${base}/auth/signin?callbackUrl=${encodeURIComponent(`${base}/dashboard`)}`
    window.location.href = target
  }

  const handleGoogle = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {}
  }

  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Subtle gradient overlays */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(88, 36, 253, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(245, 0, 30, 0.08) 0%, transparent 50%)
          `
        }}
      />

      {/* Scattered Company Pills */}
      {mounted && (
        <div className="company-pills absolute inset-0 pointer-events-none">
          {COMPANY_PILLS.map((pill, index) => {
            const position = PILL_POSITIONS[index]
            return (
              <div
                key={pill.name}
                className="company-pill absolute flex items-center gap-2 px-5 py-3 rounded-full shadow-lg pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl"
                style={{
                  ...position,
                  background: pill.color,
                  color: pill.textColor || '#FFFFFF',
                  transform: `rotate(${position.rotation}deg)`,
                  animation: `float 6s ease-in-out infinite`,
                  animationDelay: `${pill.delay}s`,
                } as React.CSSProperties}
              >
                <span className="text-xl">{pill.logo}</span>
                <span className="text-sm font-medium">{pill.name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Hero Content */}
      <div className="landing-hero relative z-10 text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Find Your Dream Job{' '}
          <span className="inline-block animate-bounce-slow">🚀</span>
        </h1>
        <p className="text-xl font-bold text-white mb-8 leading-relaxed">
          AI-powered resume optimization, company research, and application tracking—all in one platform designed for modern job seekers.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          className="landing-cta group inline-flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-[#5424FD] to-[#4318E8] text-white font-bold text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden"
        >
          <span className="relative z-10">Find Your Dream Job</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>

        <p className="mt-6 text-sm font-semibold text-white/70">
          Join 10,000+ job seekers who landed their dream roles
        </p>
      </div>

      {/* SSO Options */}
      <div className="relative z-10 mt-12 max-w-md w-full">
        <div className="text-center mb-4">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Or continue with</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleGoogle}
            className="glass-card px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-white">Google</span>
          </button>
          <button
            onClick={() => signIn('apple', { callbackUrl: '/dashboard' })}
            className="glass-card px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-sm font-medium text-white">Apple</span>
          </button>
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
            className="glass-card px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5,3L2,5.5V11H11.5V3M22,3L12.5,5.5V11H22V3M11.5,13H2V18.5L11.5,21V13M12.5,13V21L22,18.5V13H12.5Z"/>
            </svg>
            <span className="text-sm font-medium text-white">Microsoft</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-20px); 
          }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .company-pill {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}

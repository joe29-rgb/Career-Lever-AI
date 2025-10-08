/**
 * Modern Job Card Component
 * Figma-inspired job cards with color variations
 * 
 * Color themes: purple, red, yellow
 */

'use client'

import { MapPin, GraduationCap, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface ModernJobCardProps {
  id: string
  title: string
  company: string
  companyLogo?: string
  location: string
  experience: string
  workType: 'remote' | 'hybrid' | 'onsite' | 'fulltime' | 'part-time' | 'contract'
  salary: string
  currency?: string
  description: string
  postedDate: string
  colorTheme?: 'purple' | 'red' | 'yellow'
  aiRiskLevel?: 'low' | 'medium' | 'high' | 'critical'
  aiRiskScore?: number
  onView?: () => void
}

const colorThemes = {
  purple: {
    bg: '#5424FD',
    badgeBg: 'rgba(255, 255, 255, 0.2)',
    badgeBorder: 'rgba(255, 255, 255, 0.4)',
    textColor: '#FFFFFF',
    descColor: '#FFFFFF',
  },
  red: {
    bg: '#F5001E',
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    badgeBorder: 'rgba(255, 255, 255, 0.4)',
    textColor: '#FFFFFF',
    descColor: '#FFFFFF',
  },
  yellow: {
    bg: '#FCC636',
    badgeBg: 'rgba(0, 0, 0, 0.15)',
    badgeBorder: 'rgba(0, 0, 0, 0.4)',
    textColor: '#000000',
    descColor: '#000000',
  },
}

const workTypeLabels = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  fulltime: 'Fulltime',
  'part-time': 'Part-time',
  contract: 'Contract',
}

export function ModernJobCard({
  id,
  title,
  company,
  companyLogo,
  location,
  experience,
  workType,
  salary,
  currency = '$',
  description,
  postedDate,
  colorTheme = 'purple',
  aiRiskLevel,
  aiRiskScore,
  onView,
}: ModernJobCardProps) {
  const theme = colorThemes[colorTheme]
  const isYellow = colorTheme === 'yellow'

  // ENTERPRISE FIX: Smart salary parsing - detect yearly vs monthly
  const parseSalary = (salaryStr: string): { display: string; isValid: boolean } => {
    if (!salaryStr || salaryStr === 'Not disclosed' || salaryStr === '50K' || salaryStr === '$50K') {
      return { display: 'Not disclosed', isValid: false }
    }

    const lowerSalary = salaryStr.toLowerCase()

    // Check if it explicitly mentions "per year" or "yearly" or "annual"
    if (lowerSalary.includes('per year') || lowerSalary.includes('yearly') || lowerSalary.includes('annual') || lowerSalary.includes('/yr')) {
      // Extract salary range or single value
      const cleanedSalary = salaryStr.replace(/per year|yearly|annual|\/yr/gi, '').trim()
      return { display: `${cleanedSalary}/yr`, isValid: true }
    }

    // Check if it explicitly mentions "per month" or "monthly"
    if (lowerSalary.includes('per month') || lowerSalary.includes('monthly') || lowerSalary.includes('/mo')) {
      const cleanedSalary = salaryStr.replace(/per month|monthly|\/mo/gi, '').trim()
      return { display: `${cleanedSalary}/mo`, isValid: true }
    }

    // If no explicit period, assume yearly (industry standard for job postings)
    return { display: `${salaryStr}/yr`, isValid: true }
  }

  const { display: salaryDisplay, isValid: hasSalary } = parseSalary(salary)

  return (
    <div className="relative w-full rounded-[25px] overflow-hidden shadow-lg transition-transform duration-300 hover:scale-[1.02]">
      {/* Main colored section */}
      <div 
        className="relative px-4 pt-4 pb-3"
        style={{ background: theme.bg }}
      >
        {/* Company info */}
        <div className="flex items-center gap-3 mb-4">
          {/* Company logo */}
          <div className="w-12 h-12 rounded-lg bg-[#1F1F1F] flex items-center justify-center flex-shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt={company} className="w-7 h-7 object-contain" />
            ) : (
              <span className="text-white text-sm font-bold">
                {company.charAt(0)}
              </span>
            )}
          </div>

          {/* Title and company */}
          <div className="flex flex-col gap-1">
            <h3 
              className="text-lg font-bold leading-tight"
              style={{ 
                color: theme.textColor,
                fontFamily: 'var(--font-inter), Satoshi, sans-serif'
              }}
            >
              {title}
            </h3>
            <p 
              className="text-xs font-medium"
              style={{ color: theme.textColor }}
            >
              {company}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Location */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
            style={{
              background: theme.badgeBg,
              borderColor: theme.badgeBorder,
              color: theme.textColor,
            }}
          >
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>

          {/* Experience */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
            style={{
              background: theme.badgeBg,
              borderColor: theme.badgeBorder,
              color: theme.textColor,
            }}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{experience}</span>
          </div>

          {/* Work type */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
            style={{
              background: theme.badgeBg,
              borderColor: theme.badgeBorder,
              color: theme.textColor,
            }}
          >
            <Clock className="w-4 h-4" />
            <span>{workTypeLabels[workType]}</span>
          </div>

          {/* AI Risk Badge - ENTERPRISE FEATURE */}
          {aiRiskLevel && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold",
                aiRiskLevel === 'low' && "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300",
                aiRiskLevel === 'medium' && "bg-yellow-500/20 border-yellow-500/40 text-yellow-700 dark:text-yellow-300",
                aiRiskLevel === 'high' && "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300",
                aiRiskLevel === 'critical' && "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300"
              )}
            >
              🤖
              <span>
                {aiRiskLevel === 'low' && 'Safe'}
                {aiRiskLevel === 'medium' && 'Med Risk'}
                {aiRiskLevel === 'high' && 'High Risk'}
                {aiRiskLevel === 'critical' && 'Critical'}
              </span>
              {aiRiskScore && <span className="opacity-75">({aiRiskScore}%)</span>}
            </div>
          )}
        </div>

        {/* Description */}
        <p 
          className="text-xs leading-relaxed mb-4 line-clamp-2"
          style={{ 
            color: theme.descColor,
            lineHeight: '140%'
          }}
        >
          {description}
        </p>

        {/* View button - top right */}
        <Link
          href={`/jobs/${id}`}
          onClick={(e) => {
            if (onView) {
              e.preventDefault()
              onView()
            }
          }}
          className="absolute top-4 right-4 flex items-center gap-1 px-4 py-3 bg-[#2B2B2B] border border-[#4E4E4E] rounded-[25px] text-white text-sm font-bold transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <span>View</span>
          <ArrowRight className="w-4 h-4 rotate-[-45deg]" />
        </Link>
      </div>

      {/* White footer section */}
      <div className="bg-white px-4 py-4 rounded-b-[25px]">
        <div className="flex items-center justify-between">
          {/* Posted date */}
          <div className="flex items-center gap-1 text-xs text-black font-medium">
            <Clock className="w-4 h-4 text-black" />
            <span>{postedDate}</span>
          </div>

          {/* Salary */}
          <div className="text-lg font-bold text-black">
            {salaryDisplay}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Job Card Grid - displays multiple cards
 */
export function ModernJobCardGrid({ 
  jobs, 
  onViewJob 
}: { 
  jobs: ModernJobCardProps[]
  onViewJob?: (jobId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 w-full max-w-md mx-auto px-6 py-6">
      {jobs.map((job, index) => {
        // Rotate through color themes
        const themes: Array<'purple' | 'red' | 'yellow'> = ['purple', 'red', 'yellow']
        const colorTheme = themes[index % 3]
        
        return (
          <ModernJobCard
            key={job.id}
            {...job}
            colorTheme={colorTheme}
            onView={() => onViewJob?.(job.id)}
          />
        )
      })}
    </div>
  )
}


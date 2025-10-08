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
  onView,
}: ModernJobCardProps) {
  const theme = colorThemes[colorTheme]
  const isYellow = colorTheme === 'yellow'

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
            {salary && salary !== 'Not disclosed' && salary !== '50K' && salary !== '$50K' 
              ? `${currency}${salary}/mo` 
              : 'Not disclosed'
            }
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


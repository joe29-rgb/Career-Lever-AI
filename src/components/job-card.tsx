'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  EyeIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  skills?: string[]
  url: string
  logo?: string
  description?: string
  contacts?: { email?: string } // From research
  seen?: boolean // User has viewed this job
  applied?: boolean // User has applied to this job
  saved?: boolean // User has saved this job
}

interface JobCardProps {
  job: Job;
  resumeText?: string;
  coverText?: string;
  className?: string;
}

export function JobCard({ job, resumeText, coverText, className }: JobCardProps) {
  const { data: session } = useSession()
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (!session?.user?.id || !resumeText || !coverText || !job.contacts?.email) {
      toast.error('Login and complete research first.')
      return
    }

    setIsApplying(true)
    try {
      const response = await fetch('/api/outreach/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          resumeText,
          coverText,
          contacts: job.contacts,
          company: job.company,
          jobTitle: job.title
        })
      })

      if (!response.ok) {
        throw new Error('Compose failed')
      }

      const data = await response.json()
      window.location.href = data.mailtoUrl // Open email client
      toast.success(`Application sent! Tracked as ${data.applicationId}. Check your email client.`)
    } catch (error) {
      toast.error('Apply failed. Try again or check contacts.')
    } finally {
      setIsApplying(false)
    }
  }

  // Dynamic gradient classes using CSS variables
  const gradientStyles = [
    'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))', // Blue to Yellow
    'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))', // Red to Blue
    'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--warning)))', // Yellow to Orange
    'linear-gradient(135deg, hsl(var(--success)), hsl(142 76% 30%))', // Green
    'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', // Blue to Red
  ]
  const gradientIndex = parseInt(job.id) % gradientStyles.length
  const gradientStyle = gradientStyles[gradientIndex]

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative',
      className
    )}>
      {/* Status Badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {job.seen && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
            <EyeIcon className="w-3 h-3" />
            Viewed
          </div>
        )}
        {job.applied && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
            <CheckBadgeIcon className="w-3 h-3" />
            Applied
          </div>
        )}
      </div>
      {/* Modern gradient border wrapper using theme colors */}
      <div 
        className="p-1 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
        style={{ background: gradientStyle }}
      >
        <div className="bg-card rounded-[calc(1.5rem-1px)] p-6 h-full">
          <Link href={job.url} className="block">
            {/* Header with colorful logo */}
            <div className="flex items-start gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{ background: gradientStyle }}
              >
                {job.logo ? (
                  <img src={job.logo} alt={`${job.company} logo`} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{job.company.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-base font-semibold text-muted-foreground">{job.company}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {job.description || 'Exciting opportunity in a dynamic team. Apply now to learn more!'}
            </p>

            {/* Modern skill badges */}
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.slice(0, 3).map((skill, idx) => {
                  const badgeClasses = [
                    'badge-primary',
                    'badge-secondary',
                    'badge-accent',
                  ]
                  const badgeClass = badgeClasses[idx % badgeClasses.length]
                  return (
                    <span key={idx} className={`${badgeClass} text-xs font-bold`}>
                      {skill}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Salary with icon */}
            {job.salary && (
              <div className="flex items-center text-sm font-bold text-primary mb-4">
                <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                {job.salary}
              </div>
            )}
          </Link>

          {/* Modern Apply Button */}
          <Button 
            onClick={handleApply} 
            disabled={isApplying} 
            className="w-full text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 mb-3"
            style={{ background: gradientStyle }}
          >
            {isApplying ? (
              <>
                <EnvelopeIcon className="w-5 h-5 mr-2" />
                Sending...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Apply Now
              </>
            )}
          </Button>

          {/* Quick Access Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link 
              href={`/career-finder/company?company=${encodeURIComponent(job.company)}`}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              🔍 Research
            </Link>
            <Link 
              href={`/career-finder/job-analysis?job=${job.id}`}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              📊 Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

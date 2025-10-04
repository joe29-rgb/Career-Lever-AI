'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  skills: string[]
  url: string
  logo?: string
  description?: string
  contacts?: { email?: string } // From research
}

interface JobCardProps {
  job: Job
  resumeText?: string // Passed from parent
  coverText?: string // Generated cover
  className?: string;
}

export function JobCard({ job, resumeText, coverText, className }: JobCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (!session?.user?.id || !resumeText || !coverText || !job.contacts?.email) {
      toast({
        title: 'Apply Failed',
        description: 'Login and complete research first.',
        variant: 'destructive'
      })
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
      toast({
        title: 'Application Sent!',
        description: `Tracked as ${data.applicationId}. Check your email client.`,
      })
    } catch (error) {
      toast({
        title: 'Apply Failed',
        description: 'Try again or check contacts.',
        variant: 'destructive'
      })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className={`job-card group ${className || ''}`}>
      <Link href={job.url} className="block">
        <div className="job-card-header">
          <div className="job-logo">
            {job.logo ? (
              <img src={job.logo} alt={`${job.company} logo`} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">{job.company.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col items-start">
            <h3 className="job-title">{job.title}</h3>
            <p className="job-company">{job.company}</p>
            <div className="job-location">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {job.location}
            </div>
          </div>
        </div>
        <p className="job-description">
          {job.description || 'Exciting opportunity in a dynamic team. Apply now to learn more!'}
        </p>
        <div className="job-badges">
          {job.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="badge badge-primary">{skill}</span>
          ))}
        </div>
        {job.salary && (
          <div className="job-salary">
            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
            {job.salary}
          </div>
        )}
      </Link>
      <div className="job-footer">
        <Button onClick={handleApply} disabled={isApplying} className="apply-btn w-full">
          {isApplying ? (
            <>
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              Sending...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Apply Now
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

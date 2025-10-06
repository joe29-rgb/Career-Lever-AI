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
import { cn } from '@/lib/utils'

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
  job: Job;
  resumeText?: string;
  coverText?: string;
  className?: string;  // ADD THIS LINE
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

  // Vibrant gradient borders (rotate through colors)
  const gradients = [
    'from-[#5324FD] to-[#8B5CF6]',
    'from-[#F5001E] to-[#FB7185]',
    'from-[#FCC636] to-[#FB923C]',
    'from-[#10b981] to-[#059669]',
    'from-[#3b82f6] to-[#06b6d4]',
  ]
  const gradientClass = gradients[parseInt(job.id) % gradients.length]

  return (
    <div className={cn("group relative", className)}>
      {/* VIBRANT gradient border wrapper */}
      <div className={`bg-gradient-to-br ${gradientClass} p-1 rounded-3xl shadow-lg hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-2`}>
        <div className="bg-white rounded-[calc(1.5rem-1px)] p-6 h-full">
          <Link href={job.url} className="block">
            {/* Header with colorful logo */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${gradientClass} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                {job.logo ? (
                  <img src={job.logo} alt={`${job.company} logo`} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{job.company.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#5324FD] transition-colors">{job.title}</h3>
                <p className="text-base font-semibold text-gray-700">{job.company}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {job.description || 'Exciting opportunity in a dynamic team. Apply now to learn more!'}
            </p>

            {/* VIBRANT skill badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {job.skills.slice(0, 3).map((skill, idx) => {
                const badgeColors = [
                  'bg-blue-100 text-blue-700',
                  'bg-red-100 text-red-700',
                  'bg-yellow-100 text-yellow-700',
                  'bg-green-100 text-green-700',
                  'bg-purple-100 text-purple-700',
                ]
                const colorClass = badgeColors[idx % badgeColors.length]
                return (
                  <span key={idx} className={`${colorClass} px-3 py-1 rounded-full text-xs font-bold`}>
                    {skill}
                  </span>
                )
              })}
            </div>

            {/* Salary with vibrant icon */}
            {job.salary && (
              <div className={`flex items-center text-sm font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent mb-4`}>
                <CurrencyDollarIcon className="w-5 h-5 mr-1 text-gray-700" />
                {job.salary}
              </div>
            )}
          </Link>

          {/* VIBRANT Apply Button */}
          <Button 
            onClick={handleApply} 
            disabled={isApplying} 
            className={`w-full bg-gradient-to-r ${gradientClass} text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0`}
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
        </div>
      </div>
    </div>
  )
}

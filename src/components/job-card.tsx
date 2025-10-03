import { type ComponentProps } from 'react'
import Link from 'next/link'
import { 
  MapPinIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

interface Job {
  title: string
  company: string
  location: string
  salary?: string
  skills: string[]
  url: string
  logo?: string // Optional company logo URL
  description?: string
}

interface JobCardProps extends ComponentProps<'a'> {
  job: Job
}

export function JobCard({ job, className, ...props }: JobCardProps) {
  return (
    <Link href={job.url} className={`job-card group ${className || ''}`} {...props}>
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
      <div className="job-footer">
        <button className="apply-btn">
          <CheckCircleIcon className="w-4 h-4 mr-2" />
          Apply Now
        </button>
      </div>
    </Link>
  )
}

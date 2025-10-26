'use client'

import React from 'react'
import { MapPinIcon, CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    location: string
    salary?: string
    skills: string[]
    urgent?: boolean
    featured?: boolean
    logo?: string
  }
  onApply?: () => void
}

export const ModernJobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  return (
    <div className="dribbble-card p-6 group cursor-pointer">
      {/* Status Badges */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          {job.featured && (
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
              FEATURED
            </span>
          )}
          {job.urgent && (
            <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full animate-pulse">
              URGENT
            </span>
          )}
        </div>
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {job.logo ? (
            <img src={job.logo} alt={job.company} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            job.company.charAt(0)
          )}
        </div>
      </div>

      {/* Job Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 transition-colors">
          {job.title}
        </h3>
        <p className="text-gray-600 font-medium text-lg">{job.company}</p>
      </div>

      {/* Location & Salary */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4 text-blue-500" />
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-green-600">{job.salary}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {job.skills.slice(0, 3).map((skill, index) => (
          <span 
            key={skill}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              index === 0 ? 'bg-blue-100 text-blue-700' :
              index === 1 ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 3 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            +{job.skills.length - 3}
          </span>
        )}
      </div>

      {/* Apply Button */}
      <button 
        onClick={onApply}
        className="btn-dribbble-primary w-full group-hover:scale-[1.02] transition-transform"
      >
        <span className="flex items-center justify-center gap-2">
          Apply Now
          <CheckCircleIcon className="w-5 h-5" />
        </span>
      </button>
    </div>
  )
}


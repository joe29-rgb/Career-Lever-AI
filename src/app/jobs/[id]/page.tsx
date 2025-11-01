/**
 * Job Details Page
 * Figma-inspired job details with all sections
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, CheckCircle, User, Gift, Send } from 'lucide-react'
import { MapPin, GraduationCap, Clock } from 'lucide-react'

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Mock job data - will be replaced with API call
  const job = {
    id: params?.id || 'unknown',
    title: 'Graphic Designer',
    company: 'Spotify',
    companyLogo: null,
    location: 'Remote',
    experience: 'Freshers',
    workType: 'Fulltime',
    salary: '50K',
    postedDate: 'Posted 2 days ago',
    colorTheme: 'yellow' as const,
    description: 'In a UX Designer job, you\'ll need both types of skills to develop the next generation of products. You\'ll partner with Researchers and Designers to define and deliver new features.',
    requirements: [
      '3 years experience',
      'Degree in Computer Science, Psychology, Design or any other related fields.',
      'Proficiency in User Personas, Competitive Analysis, Empathy Maps and Information Architecture.'
    ],
    role: 'As a UX Designer, you will be directly responsible for helping the evolution of enterprise design systems at Google. You will engineer solutions that create shareable web components to be used in enterprise products within the organization. You\'ll support multiple different product areas and collaborate with multiple job functions across the globe.',
    benefits: [
      'Lorem ipsum dolor sit amet consectetur. Ut sit tincidunt nec quis vel quisque nunc egestas. Et rutrum amet volutpat orci. Magna id arcu viverra justo ut vel tortor. Quis in morbi laoreet diam neque congue nec facilisi.',
      'Lorem ipsum dolor sit amet consectetur. Ut sit tincidunt nec quis vel quisque nunc egestas. Et rutrum amet volutpat orci. Magna id arcu viverra justo ut vel tortor. Quis in morbi laoreet diam neque congue nec facilisi.'
    ]
  }

  const colorThemes = {
    purple: '#5424FD',
    red: '#F5001E',
    yellow: '#FCC636',
  }

  const bgColor = colorThemes[job.colorTheme]
  const isYellow = job.colorTheme === 'yellow'
  const textColor = isYellow ? '#000000' : '#FFFFFF'
  const badgeBg = isYellow ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)'
  const badgeBorder = isYellow ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)'

  const handleApply = () => {
    router.push(`/jobs/${job.id}/apply`)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save functionality
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-lg font-medium">Job Details</span>
            </button>

            {/* User avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-gradient-primary" />
          </div>
        </div>
      </div>

      {/* Job Header Card */}
      <div className="container mx-auto px-6 py-6">
        <div 
          className="relative rounded-3xl overflow-hidden shadow-xl"
          style={{ background: bgColor }}
        >
          {/* Main content */}
          <div className="px-4 pt-4 pb-3">
            {/* Company info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#1F1F1F] flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {job.company.charAt(0)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h1 
                  className="text-lg font-bold"
                  style={{ color: textColor }}
                >
                  {job.title}
                </h1>
                <p 
                  className="text-xs font-medium"
                  style={{ color: textColor }}
                >
                  {job.company}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
                style={{
                  background: badgeBg,
                  borderColor: badgeBorder,
                  color: textColor,
                }}
              >
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
                style={{
                  background: badgeBg,
                  borderColor: badgeBorder,
                  color: textColor,
                }}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{job.experience}</span>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium"
                style={{
                  background: badgeBg,
                  borderColor: badgeBorder,
                  color: textColor,
                }}
              >
                <Clock className="w-4 h-4" />
                <span>{job.workType}</span>
              </div>
            </div>
          </div>

          {/* White footer */}
          <div className="bg-card px-4 py-4 rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                <Clock className="w-4 h-4" />
                <span>{job.postedDate}</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                ${job.salary}/mo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details Sections */}
      <div className="container mx-auto px-6 space-y-4">
        {/* Job Description */}
        <div className="bg-[#2B2B2B] rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-card/10 flex items-center justify-center">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Job Description</h2>
          </div>
          <p className="text-sm text-white leading-relaxed opacity-90">
            {job.description}
          </p>
        </div>

        {/* Skills & Requirements */}
        <div className="bg-[#2B2B2B] rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-card/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Skills & Requirements</h2>
          </div>
          <ul className="space-y-2">
            {job.requirements.map((req, index) => (
              <li key={index} className="text-sm text-white leading-relaxed opacity-90 flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Your Role */}
        <div className="bg-[#2B2B2B] rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-card/10 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Your Role</h2>
          </div>
          <p className="text-sm text-white leading-relaxed opacity-90">
            {job.role}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-[#2B2B2B] rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-card/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Benefits</h2>
          </div>
          <div className="space-y-3">
            {job.benefits.map((benefit, index) => (
              <p key={index} className="text-sm text-white leading-relaxed opacity-90">
                {benefit}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 p-6 z-50">
        <div className="container mx-auto flex items-center gap-3 relative">
          {/* Background progress bar */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-card rounded-full -z-10" />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center px-6 py-3 bg-card text-foreground font-medium text-base rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 z-10"
          >
            Save
          </button>

          {/* Apply Now button */}
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#5424FD] text-white font-bold text-base rounded-full transition-all duration-200 hover:scale-105 active:scale-95 z-20"
          >
            <span>Apply Now</span>
            <Send className="w-5 h-5 rotate-[-45deg]" />
          </button>
        </div>
      </div>
    </div>
  )
}


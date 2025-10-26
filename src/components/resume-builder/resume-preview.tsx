'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut, Download, Eye } from 'lucide-react'

interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
    summary: string
  }
  experience: Array<{
    company: string
    position: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    achievements: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    graduationDate: string
  }>
  skills: {
    technical: string[]
    soft: string[]
  }
}

interface ResumePreviewProps {
  resume: ResumeData
  template?: string
}

export function ResumePreview({ resume, template = 'modern' }: ResumePreviewProps) {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 150))
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50))

  return (
    <div className="sticky top-4 bg-card rounded-xl border-2 border-border shadow-lg">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-foreground">Live Preview</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <button
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6 bg-gray-100 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div
          className="bg-card shadow-xl mx-auto transition-transform"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: '8.5in',
            minHeight: '11in',
            padding: '0.75in'
          }}
        >
          {/* Modern Template */}
          {template === 'modern' && (
            <div className="space-y-6">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 -m-6 mb-6 rounded-t-lg">
                <h1 className="text-3xl font-bold mb-2">
                  {resume.personalInfo.fullName || 'Your Name'}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm">
                  {resume.personalInfo.email && (
                    <span>📧 {resume.personalInfo.email}</span>
                  )}
                  {resume.personalInfo.phone && (
                    <span>📱 {resume.personalInfo.phone}</span>
                  )}
                  {resume.personalInfo.location && (
                    <span>📍 {resume.personalInfo.location}</span>
                  )}
                </div>
                {resume.personalInfo.linkedin && (
                  <div className="mt-2 text-sm">
                    🔗 {resume.personalInfo.linkedin}
                  </div>
                )}
              </div>

              {/* Summary */}
              {resume.personalInfo.summary && (
                <div>
                  <h2 className="text-xl font-bold text-foreground border-b-2 border-blue-600 pb-2 mb-3">
                    Professional Summary
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {resume.personalInfo.summary}
                  </p>
                </div>
              )}

              {/* Experience */}
              {resume.experience.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-foreground border-b-2 border-blue-600 pb-2 mb-3">
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {resume.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-foreground">{exp.position}</h3>
                            <p className="text-gray-700">{exp.company} • {exp.location}</p>
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        {exp.achievements.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                            {exp.achievements.map((achievement, j) => (
                              <li key={j}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.education.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-foreground border-b-2 border-blue-600 pb-2 mb-3">
                    Education
                  </h2>
                  <div className="space-y-3">
                    {resume.education.map((edu, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-foreground">{edu.degree} in {edu.field}</h3>
                            <p className="text-gray-700">{edu.institution}</p>
                          </div>
                          <span className="text-sm text-gray-600">{edu.graduationDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {(resume.skills.technical.length > 0 || resume.skills.soft.length > 0) && (
                <div>
                  <h2 className="text-xl font-bold text-foreground border-b-2 border-blue-600 pb-2 mb-3">
                    Skills
                  </h2>
                  {resume.skills.technical.length > 0 && (
                    <div className="mb-2">
                      <span className="font-semibold text-foreground">Technical: </span>
                      <span className="text-gray-700">{resume.skills.technical.join(' • ')}</span>
                    </div>
                  )}
                  {resume.skills.soft.length > 0 && (
                    <div>
                      <span className="font-semibold text-foreground">Soft Skills: </span>
                      <span className="text-gray-700">{resume.skills.soft.join(' • ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!resume.personalInfo.fullName && (
            <div className="flex items-center justify-center h-full text-center text-gray-400">
              <div>
                <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Your resume preview will appear here</p>
                <p className="text-sm">Start filling in your information →</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

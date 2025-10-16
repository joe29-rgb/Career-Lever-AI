import React from 'react'
import type { Resume } from '@/lib/resume/parser'
import { formatDate, formatDateRange } from '@/lib/resume/parser'

export interface TemplateProps {
  resume: Resume
  variant: 'A' | 'B'
  config?: TemplateConfig
}

export interface TemplateConfig {
  colorScheme?: 'blue' | 'green' | 'purple' | 'black' | 'red'
  fontSize?: 'small' | 'medium' | 'large'
  margins?: 'narrow' | 'normal' | 'wide'
  sectionSpacing?: 'compact' | 'normal' | 'spacious'
}

export const BaseTemplate: React.FC<TemplateProps> = ({ resume, config }) => {
  const colors = {
    blue: '#2563eb',
    green: '#059669',
    purple: '#7c3aed',
    black: '#1a1a1a',
    red: '#dc2626'
  }
  
  const primaryColor = colors[config?.colorScheme || 'blue']
  const fontSize = config?.fontSize === 'small' ? '10pt' : config?.fontSize === 'large' ? '12pt' : '11pt'
  const margin = config?.margins === 'narrow' ? '0.5in' : config?.margins === 'wide' ? '1in' : '0.75in'
  
  return (
    <div 
      className="resume-template bg-white text-gray-900 max-w-[8.5in] mx-auto shadow-lg"
      style={{ 
        fontSize,
        padding: margin,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: '1.5'
      }}
    >
      {/* Header */}
      <header className="mb-6 pb-4" style={{ borderBottom: `2px solid ${primaryColor}` }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
          {resume.personalInfo.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {resume.personalInfo.email && <span>📧 {resume.personalInfo.email}</span>}
          {resume.personalInfo.phone && <span>📱 {resume.personalInfo.phone}</span>}
          {resume.personalInfo.location && <span>📍 {resume.personalInfo.location}</span>}
          {resume.personalInfo.linkedin && (
            <a href={resume.personalInfo.linkedin} className="text-blue-600 hover:underline">
              LinkedIn
            </a>
          )}
          {resume.personalInfo.github && (
            <a href={resume.personalInfo.github} className="text-blue-600 hover:underline">
              GitHub
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2 uppercase tracking-wide" style={{ color: primaryColor }}>
            Professional Summary
          </h2>
          <p className="text-gray-700">{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
          Professional Experience
        </h2>
        {resume.experience.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-base font-semibold">{exp.title}</h3>
              <span className="text-sm text-gray-600">
                {formatDateRange(exp)}
              </span>
            </div>
            <div className="text-sm text-gray-600 italic mb-2">
              {exp.company}{exp.location ? ` | ${exp.location}` : ''}
            </div>
            {exp.description && <p className="text-sm text-gray-700 mb-2">{exp.description}</p>}
            <ul className="list-disc list-inside space-y-1">
              {exp.achievements.map((achievement, j) => (
                <li key={j} className="text-sm text-gray-700">{achievement}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
          Skills & Competencies
        </h2>
        <div className="space-y-2">
          {resume.skills.technical.length > 0 && (
            <div>
              <span className="font-semibold text-sm">Technical: </span>
              <span className="text-sm text-gray-700">{resume.skills.technical.join(' • ')}</span>
            </div>
          )}
          {resume.skills.soft.length > 0 && (
            <div>
              <span className="font-semibold text-sm">Professional: </span>
              <span className="text-sm text-gray-700">{resume.skills.soft.join(' • ')}</span>
            </div>
          )}
        </div>
      </section>

      {/* Education */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
          Education
        </h2>
        {resume.education.map((edu, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-semibold">{edu.degree}</h3>
              <span className="text-sm text-gray-600">{formatDate(edu.graduationDate)}</span>
            </div>
            <div className="text-sm text-gray-600 italic">
              {edu.institution}{edu.location ? ` | ${edu.location}` : ''}
            </div>
            {edu.gpa && <div className="text-sm text-gray-700">GPA: {edu.gpa}</div>}
            {edu.honors && edu.honors.length > 0 && (
              <div className="text-sm text-gray-700">{edu.honors.join(', ')}</div>
            )}
          </div>
        ))}
      </section>

      {/* Certifications */}
      {resume.skills.certifications && resume.skills.certifications.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Certifications
          </h2>
          {resume.skills.certifications.map((cert, i) => (
            <div key={i} className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">{cert.name}</span> | {cert.issuer} | {formatDate(cert.date)}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide" style={{ color: primaryColor }}>
            Projects
          </h2>
          {resume.projects.map((project, i) => (
            <div key={i} className="mb-3">
              <h3 className="text-base font-semibold">{project.name}</h3>
              <div className="text-sm text-gray-600 italic mb-1">
                {project.technologies.join(', ')}
              </div>
              <p className="text-sm text-gray-700 mb-1">{project.description}</p>
              {project.achievements.length > 0 && (
                <ul className="list-disc list-inside">
                  {project.achievements.map((achievement, j) => (
                    <li key={j} className="text-sm text-gray-700">{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

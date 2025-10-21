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
  // Validation
  if (!resume || !resume.personalInfo) {
    return (
      <div style={{ padding: '40px', color: 'red', fontFamily: 'Arial, sans-serif' }}>
        ⚠️ Invalid resume data
      </div>
    )
  }

  const colors = {
    blue: '#2563eb',
    green: '#059669',
    purple: '#7c3aed',
    black: '#1a1a1a',
    red: '#dc2626'
  }
  
  const primaryColor = colors[config?.colorScheme || 'blue']
  const baseFontSize = config?.fontSize === 'small' ? 10 : config?.fontSize === 'large' ? 12 : 11
  const margin = config?.margins === 'narrow' ? '0.5in' : config?.margins === 'wide' ? '1in' : '0.75in'
  
  // ALL INLINE STYLES - NO TAILWIND
  const styles = {
    page: {
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      maxWidth: '8.5in',
      margin: '0 auto',
      padding: margin,
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: `${baseFontSize}pt`,
      lineHeight: '1.5',
      boxSizing: 'border-box' as const
    },
    header: {
      marginBottom: '20pt',
      paddingBottom: '12pt',
      borderBottom: `2pt solid ${primaryColor}` 
    },
    name: {
      fontSize: '26pt',
      fontWeight: 'bold' as const,
      color: primaryColor,
      marginBottom: '4pt',
      marginTop: 0
    },
    contactLine: {
      fontSize: '10pt',
      color: '#4a5568',
      marginBottom: 0
    },
    section: {
      marginBottom: '18pt',
      pageBreakInside: 'avoid' as const
    },
    sectionHeader: {
      fontSize: '13pt',
      fontWeight: 'bold' as const,
      color: primaryColor,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5pt',
      marginBottom: '10pt',
      marginTop: 0,
      borderBottom: `1pt solid ${primaryColor}`,
      paddingBottom: '4pt'
    },
    summaryText: {
      fontSize: `${baseFontSize}pt`,
      color: '#2d3748',
      lineHeight: '1.6',
      margin: 0
    },
    experienceItem: {
      marginBottom: '14pt',
      pageBreakInside: 'avoid' as const
    },
    experienceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '4pt'
    },
    jobTitle: {
      fontSize: '12pt',
      fontWeight: 'bold' as const,
      color: '#1a1a1a',
      margin: 0
    },
    dateRange: {
      fontSize: '10pt',
      color: '#718096',
      fontStyle: 'italic' as const
    },
    companyLocation: {
      fontSize: '10pt',
      color: '#4a5568',
      fontStyle: 'italic' as const,
      marginBottom: '6pt'
    },
    description: {
      fontSize: `${baseFontSize}pt`,
      color: '#2d3748',
      marginBottom: '6pt',
      marginTop: 0
    },
    achievementList: {
      marginLeft: '20pt',
      marginTop: '4pt',
      marginBottom: 0,
      paddingLeft: 0
    },
    achievementItem: {
      fontSize: `${baseFontSize}pt`,
      color: '#2d3748',
      marginBottom: '4pt',
      lineHeight: '1.5'
    }
  }

  // Build clean contact line (NO EMOJIS)
  const contactParts: string[] = []
  const { location, phone, email } = resume.personalInfo
  if (location) contactParts.push(location)
  if (phone) contactParts.push(phone)
  if (email) contactParts.push(email)

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.name}>{resume.personalInfo.name}</h1>
        <div style={styles.contactLine}>
          {contactParts.join(' | ')}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Professional Summary</h2>
          <p style={styles.summaryText}>{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Professional Experience</h2>
          {resume.experience.map((exp, i) => (
            <div key={i} style={styles.experienceItem}>
              <div style={styles.experienceHeader}>
                <h3 style={styles.jobTitle}>{exp.title}</h3>
                <span style={styles.dateRange}>{formatDateRange(exp)}</span>
              </div>
              <div style={styles.companyLocation}>
                {exp.company}{exp.location ? ` | ${exp.location}` : ''}
              </div>
              {exp.description && (
                <p style={styles.description}>{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={styles.achievementList}>
                  {exp.achievements.map((achievement, j) => (
                    <li key={j} style={styles.achievementItem}>{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {resume.skills && (resume.skills.technical?.length > 0 || resume.skills.soft?.length > 0) && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Skills</h2>
          {resume.skills.technical && resume.skills.technical.length > 0 && (
            <div style={{ marginBottom: '6pt' }}>
              <span style={{ fontWeight: 'bold', fontSize: `${baseFontSize}pt` }}>Technical: </span>
              <span style={{ fontSize: `${baseFontSize}pt`, color: '#2d3748' }}>
                {resume.skills.technical.join(' • ')}
              </span>
            </div>
          )}
          {resume.skills.soft && resume.skills.soft.length > 0 && (
            <div>
              <span style={{ fontWeight: 'bold', fontSize: `${baseFontSize}pt` }}>Professional: </span>
              <span style={{ fontSize: `${baseFontSize}pt`, color: '#2d3748' }}>
                {resume.skills.soft.join(' • ')}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Education</h2>
          {resume.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={styles.experienceHeader}>
                <h3 style={styles.jobTitle}>{edu.degree}</h3>
                <span style={styles.dateRange}>{formatDate(edu.graduationDate)}</span>
              </div>
              <div style={styles.companyLocation}>
                {edu.institution}{edu.location ? ` | ${edu.location}` : ''}
              </div>
              {edu.gpa && <div style={{ fontSize: '10pt', color: '#2d3748', marginTop: '2pt' }}>GPA: {edu.gpa}</div>}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {resume.skills?.certifications && resume.skills.certifications.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Certifications</h2>
          {resume.skills.certifications.map((cert, i) => (
            <div key={i} style={{ fontSize: `${baseFontSize}pt`, color: '#2d3748', marginBottom: '4pt' }}>
              <span style={{ fontWeight: 'bold' }}>{cert.name}</span> | {cert.issuer} | {formatDate(cert.date)}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Projects</h2>
          {resume.projects.map((project, i) => (
            <div key={i} style={styles.experienceItem}>
              <h3 style={styles.jobTitle}>{project.name}</h3>
              <div style={styles.companyLocation}>{project.technologies.join(', ')}</div>
              <p style={styles.description}>{project.description}</p>
              {project.achievements && project.achievements.length > 0 && (
                <ul style={styles.achievementList}>
                  {project.achievements.map((achievement, j) => (
                    <li key={j} style={styles.achievementItem}>{achievement}</li>
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

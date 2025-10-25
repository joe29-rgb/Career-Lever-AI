'use client'

import { useState } from 'react'
import { Download, FileText, Link2, Copy, Check, Loader2 } from 'lucide-react'

interface ExportHubProps {
  resume: any
}

export function ExportHub({ resume }: ExportHubProps) {
  const [exporting, setExporting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateResumeHTML = (resume: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { font-size: 28px; margin-bottom: 5px; color: #1a1a1a; }
          h2 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
          .contact { font-size: 14px; color: #666; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .job { margin-bottom: 15px; }
          .job-title { font-weight: bold; font-size: 16px; }
          .job-company { font-style: italic; color: #666; font-size: 14px; }
          ul { margin: 5px 0; padding-left: 20px; }
          li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>${resume.personalInfo?.name || 'Your Name'}</h1>
        <div class="contact">
          ${[resume.personalInfo?.email, resume.personalInfo?.phone, resume.personalInfo?.location].filter(Boolean).join(' | ')}
        </div>
        
        ${resume.personalInfo?.summary ? `
          <div class="section">
            <h2>PROFESSIONAL SUMMARY</h2>
            <p>${resume.personalInfo.summary}</p>
          </div>
        ` : ''}
        
        ${resume.experience?.length ? `
          <div class="section">
            <h2>EXPERIENCE</h2>
            ${resume.experience.map((exp: any) => `
              <div class="job">
                <div class="job-title">${exp.position || 'Position'}</div>
                <div class="job-company">${exp.company || 'Company'} | ${exp.location || ''} | ${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
                ${exp.achievements?.length ? `
                  <ul>
                    ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${resume.education?.length ? `
          <div class="section">
            <h2>EDUCATION</h2>
            ${resume.education.map((edu: any) => `
              <div class="job">
                <div class="job-title">${edu.degree || 'Degree'} in ${edu.field || 'Field'}</div>
                <div class="job-company">${edu.institution || 'Institution'} | ${edu.graduationDate || ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${resume.skills?.length ? `
          <div class="section">
            <h2>SKILLS</h2>
            <p>${resume.skills.join(' • ')}</p>
          </div>
        ` : ''}
      </body>
      </html>
    `
  }

  const handleExportPDF = async () => {
    setExporting('pdf')
    try {
      // Generate HTML from resume
      const resumeHtml = generateResumeHTML(resume)
      
      const response = await fetch('/api/resume/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeHtml,
          filename: `${resume.personalInfo?.name || 'resume'}.pdf`
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${resume.personalInfo?.name || 'resume'}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('PDF export error:', error)
    } finally {
      setExporting(null)
    }
  }

  const handleExportWord = async () => {
    setExporting('word')
    try {
      const response = await fetch('/api/resume/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume,
          filename: `${resume.personalInfo?.name || 'resume'}.docx`
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${resume.personalInfo?.name || 'resume'}.docx`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Word export error:', error)
    } finally {
      setExporting(null)
    }
  }

  const handleCopyText = () => {
    const text = generatePlainText(resume)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generatePlainText = (resume: any) => {
    let text = ''
    
    // Personal Info
    if (resume.personalInfo) {
      text += `${resume.personalInfo.fullName}\n`
      text += `${resume.personalInfo.email} | ${resume.personalInfo.phone}\n`
      if (resume.personalInfo.location) text += `${resume.personalInfo.location}\n`
      if (resume.personalInfo.linkedin) text += `${resume.personalInfo.linkedin}\n`
      text += '\n'
    }

    // Summary
    if (resume.personalInfo?.summary) {
      text += 'PROFESSIONAL SUMMARY\n'
      text += `${resume.personalInfo.summary}\n\n`
    }

    // Experience
    if (resume.experience?.length > 0) {
      text += 'PROFESSIONAL EXPERIENCE\n\n'
      resume.experience.forEach((exp: any) => {
        text += `${exp.position}\n`
        text += `${exp.company} | ${exp.location}\n`
        text += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`
        if (exp.achievements?.length > 0) {
          exp.achievements.forEach((achievement: string) => {
            text += `• ${achievement}\n`
          })
        }
        text += '\n'
      })
    }

    // Education
    if (resume.education?.length > 0) {
      text += 'EDUCATION\n\n'
      resume.education.forEach((edu: any) => {
        text += `${edu.degree} in ${edu.field}\n`
        text += `${edu.institution}\n`
        text += `${edu.graduationDate}\n\n`
      })
    }

    // Skills
    if (resume.skills) {
      text += 'SKILLS\n\n'
      if (resume.skills.technical?.length > 0) {
        text += `Technical: ${resume.skills.technical.join(', ')}\n`
      }
      if (resume.skills.soft?.length > 0) {
        text += `Soft Skills: ${resume.skills.soft.join(', ')}\n`
      }
    }

    return text
  }

  return (
    <div className="bg-card rounded-xl border-2 border-border p-6">
      <h3 className="text-xl font-bold text-foreground mb-4">📤 Download Your Resume</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF Export */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">PDF</h4>
              <p className="text-xs text-gray-600">Best for applications</p>
            </div>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={exporting === 'pdf'}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting === 'pdf' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF
              </>
            )}
          </button>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>ATS-friendly</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>Print-ready</span>
            </div>
          </div>
        </div>

        {/* Word Export */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Word (DOCX)</h4>
              <p className="text-xs text-gray-600">Editable for recruiters</p>
            </div>
          </div>
          <button
            onClick={handleExportWord}
            disabled={exporting === 'word'}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting === 'word' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Word
              </>
            )}
          </button>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>Fully editable</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>Widely accepted</span>
            </div>
          </div>
        </div>

        {/* Plain Text */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <Copy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Plain Text</h4>
              <p className="text-xs text-gray-600">For online forms</p>
            </div>
          </div>
          <button
            onClick={handleCopyText}
            className="w-full py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy to Clipboard
              </>
            )}
          </button>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>Copy-paste ready</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>No formatting loss</span>
            </div>
          </div>
        </div>

        {/* Shareable Link (Premium) */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Shareable Link</h4>
              <p className="text-xs text-gray-600">Online portfolio version</p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-3 bg-purple-300 text-white rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Link2 className="w-5 h-5" />
            Create Link
          </button>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>Beautiful web version</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <Check className="w-3 h-3 text-green-500" />
              <span>Track views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-800">
          <strong>💼 Apply to Multiple Jobs?</strong> Download all formats at once for maximum compatibility!
        </p>
      </div>
    </div>
  )
}

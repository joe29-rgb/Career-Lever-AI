'use client'

import { useState } from 'react'
import { Download, FileText, Link2, Copy, Check, Loader2 } from 'lucide-react'

interface ExportHubProps {
  resume: any
}

export function ExportHub({ resume }: ExportHubProps) {
  const [exporting, setExporting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExportPDF = async () => {
    setExporting('pdf')
    try {
      const response = await fetch('/api/resume/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${resume.personalInfo?.fullName || 'resume'}.pdf`
        a.click()
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
      const response = await fetch('/api/resume/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${resume.personalInfo?.fullName || 'resume'}.docx`
        a.click()
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
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📤 Download Your Resume</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF Export */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">PDF</h4>
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
              <h4 className="font-bold text-gray-900">Word (DOCX)</h4>
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
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <Copy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Plain Text</h4>
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
              <h4 className="font-bold text-gray-900">Shareable Link</h4>
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

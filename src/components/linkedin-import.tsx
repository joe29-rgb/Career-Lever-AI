'use client'

import { useState } from 'react'
import { Upload, Linkedin, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface LinkedInImportProps {
  onImport: (resumeData: any) => void
  className?: string
}

export function LinkedInImport({ onImport, className = '' }: LinkedInImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [linkedInUrl, setLinkedInUrl] = useState('')

  const handleLinkedInPDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file from LinkedIn')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload and parse LinkedIn PDF
      const formData = new FormData()
      formData.append('file', file)
      formData.append('source', 'linkedin')

      const response = await fetch('/api/resume/parse-linkedin', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to parse LinkedIn resume')
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        onImport(data.resumeData)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(data.error || 'Failed to import LinkedIn data')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLinkedInUrlScrape = async () => {
    if (!linkedInUrl.trim()) {
      setError('Please enter your LinkedIn profile URL')
      return
    }

    // Validate LinkedIn URL
    if (!linkedInUrl.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/resume/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedInUrl })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to scrape LinkedIn profile')
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        onImport(data.resumeData)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(data.error || 'Failed to import LinkedIn data')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLinkedInTextPaste = async (text: string) => {
    if (!text.trim()) return

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/resume/parse-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'linkedin' })
      })

      if (!response.ok) {
        throw new Error('Failed to parse LinkedIn data')
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        onImport(data.resumeData)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        throw new Error(data.error || 'Failed to import LinkedIn data')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* LinkedIn URL Input - PRIMARY METHOD */}
      <div className="border-2 border-solid border-blue-500 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <Linkedin className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Auto-Import from LinkedIn</h3>
            <p className="text-sm text-gray-600">Enter your LinkedIn profile URL to automatically import your data</p>
          </div>
        </div>
        <div className="space-y-3">
          <input
            type="url"
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
            disabled={isProcessing}
            className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
          <button
            onClick={handleLinkedInUrlScrape}
            disabled={isProcessing || !linkedInUrl.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-base flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importing from LinkedIn...
              </>
            ) : (
              <>
                <Linkedin className="w-5 h-5" />
                Import My LinkedIn Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or use alternative methods</span>
        </div>
      </div>

      {/* LinkedIn PDF Upload - ALTERNATIVE */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <label className="cursor-pointer block">
          <input
            type="file"
            accept=".pdf"
            onChange={handleLinkedInPDFUpload}
            disabled={isProcessing}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Linkedin className="w-6 h-6 text-blue-600" />
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Import from LinkedIn PDF</p>
              <p className="text-sm text-gray-600 mt-1">
                Download your profile as PDF from LinkedIn, then upload it here
              </p>
            </div>
            <button
              type="button"
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Choose LinkedIn PDF'}
            </button>
          </div>
        </label>
      </div>

      {/* LinkedIn Text Paste */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-600 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">Or paste LinkedIn profile text</p>
            <textarea
              placeholder="Copy your LinkedIn profile text and paste it here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isProcessing}
              onPaste={(e) => {
                e.preventDefault()
                const text = e.clipboardData.getData('text')
                handleLinkedInTextPaste(text)
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: Go to your LinkedIn profile, select all text (Ctrl+A), copy (Ctrl+C), then paste here
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Linkedin className="w-4 h-4" />
          How to export from LinkedIn:
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Go to your LinkedIn profile</li>
          <li>Click "More" → "Save to PDF"</li>
          <li>Upload the downloaded PDF here</li>
        </ol>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Import Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">LinkedIn Data Imported!</p>
            <p className="text-sm text-green-700">Your profile has been successfully imported</p>
          </div>
        </div>
      )}
    </div>
  )
}

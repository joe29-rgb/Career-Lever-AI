'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Upload, Linkedin, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface LinkedInImportProps {
  onImport: (resumeData: any) => void
  className?: string
  mode?: 'structured' | 'upload' // structured = return ResumeData, upload = create Resume record
}

export function LinkedInImport({ onImport, className = '', mode = 'upload' }: LinkedInImportProps) {
  const { data: session, status } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [autoFetched, setAutoFetched] = useState(false)

  // Auto-fetch profile if user is already signed in
  useEffect(() => {
    if (session?.user && status === 'authenticated' && !autoFetched) {
      console.log('[LINKEDIN_IMPORT] Auto-fetching profile for authenticated user, mode:', mode)
      setAutoFetched(true)
      fetchLinkedInProfile()
    } else {
      console.log('[LINKEDIN_IMPORT] Not auto-fetching:', { 
        hasSession: !!session?.user, 
        status, 
        autoFetched,
        mode 
      })
    }
  }, [session, status, autoFetched, mode])

  const fetchLinkedInProfile = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/linkedin/profile')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch LinkedIn profile')
      }

      const data = await response.json()
      console.log('[LINKEDIN_IMPORT] Profile API response:', { success: data.success, hasResumeData: !!data.resumeData })
      
      if (data.success && data.resumeData) {
        if (mode === 'structured') {
          // Resume Builder mode: Return structured data directly
          console.log('[LINKEDIN_IMPORT] Structured mode - returning resumeData:', data.resumeData)
          setSuccess(true)
          onImport(data.resumeData)
          setTimeout(() => setSuccess(false), 3000)
        } else {
          // Career Finder mode: Convert to text and upload to create Resume record
          const resumeText = convertResumeDataToText(data.resumeData)
          
          // Upload to API to create Resume record
          const uploadResponse = await fetch('/api/resume/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: resumeText,
              source: 'linkedin-oauth',
              fileName: 'LinkedIn Profile.txt'
            })
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to save LinkedIn profile')
          }

          const uploadData = await uploadResponse.json()
          
          setSuccess(true)
          onImport(uploadData.resume) // Pass the Resume object with _id and extractedText
          setTimeout(() => setSuccess(false), 3000)
        }
      } else {
        throw new Error(data.error || 'Failed to import LinkedIn data')
      }
    } catch (err) {
      const errorMessage = (err as Error).message
      console.error('[LINKEDIN_IMPORT] Error:', errorMessage)
      // Show all errors in structured mode (resume builder needs to know)
      if (mode === 'structured' || !errorMessage.includes('No LinkedIn access token')) {
        setError(errorMessage)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Helper function to convert structured resume data to text
  const convertResumeDataToText = (resumeData: any): string => {
    let text = ''
    
    // Personal Info
    if (resumeData.personalInfo) {
      const p = resumeData.personalInfo
      text += `${p.fullName || ''}\n`
      if (p.email) text += `${p.email}\n`
      if (p.phone) text += `${p.phone}\n`
      if (p.location) text += `${p.location}\n`
      if (p.linkedin) text += `${p.linkedin}\n`
      if (p.website) text += `${p.website}\n`
      if (p.summary) text += `\n${p.summary}\n`
      text += '\n'
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      text += 'WORK EXPERIENCE\n\n'
      resumeData.experience.forEach((exp: any) => {
        text += `${exp.position || ''}\n`
        text += `${exp.company || ''} | ${exp.location || ''}\n`
        text += `${exp.startDate || ''} - ${exp.endDate || 'Present'}\n`
        if (exp.description) text += `${exp.description}\n`
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((ach: string) => text += `• ${ach}\n`)
        }
        text += '\n'
      })
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      text += 'EDUCATION\n\n'
      resumeData.education.forEach((edu: any) => {
        text += `${edu.degree || ''} in ${edu.field || ''}\n`
        text += `${edu.institution || ''}\n`
        if (edu.graduationDate) text += `Graduated: ${edu.graduationDate}\n`
        if (edu.gpa) text += `GPA: ${edu.gpa}\n`
        text += '\n'
      })
    }
    
    // Skills
    if (resumeData.skills) {
      const allSkills = [
        ...(resumeData.skills.technical || []),
        ...(resumeData.skills.soft || [])
      ]
      if (allSkills.length > 0) {
        text += 'SKILLS\n\n'
        text += allSkills.join(', ') + '\n\n'
      }
    }
    
    return text
  }

  const handleLinkedInOAuth = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // If already signed in, just fetch the profile
      if (session?.user) {
        await fetchLinkedInProfile()
        return
      }

      // Sign in with LinkedIn OAuth (will redirect)
      await signIn('linkedin', {
        callbackUrl: window.location.href
      })

      // Note: After redirect, the page will reload and auto-fetch will handle profile import
    } catch (err) {
      setError((err as Error).message)
      setIsProcessing(false)
    }
  }

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
      {/* Status Indicator */}
      {session?.user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-900 font-medium">
              {isProcessing ? 'Importing LinkedIn profile...' : 'Signed in - Click button below to import'}
            </span>
          </div>
        </div>
      )}

      {/* LinkedIn OAuth Sign-In - PRIMARY METHOD */}
      <div className="border-2 border-solid border-blue-600 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Linkedin className="w-10 h-10 text-blue-600" />
          <div>
            <h3 className="font-bold text-foreground text-xl">Sign in with LinkedIn</h3>
            <p className="text-sm text-gray-600">Securely connect your LinkedIn account to automatically import your profile</p>
          </div>
        </div>
        <button
          onClick={handleLinkedInOAuth}
          disabled={isProcessing}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-md hover:shadow-xl"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Connecting to LinkedIn...
            </>
          ) : (
            <>
              <Linkedin className="w-6 h-6" />
              Sign in with LinkedIn
            </>
          )}
        </button>
        <div className="mt-3 text-xs text-gray-500 text-center">
          ✓ Secure OAuth 2.0 • ✓ Official LinkedIn API • ✓ No password sharing
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-gray-500">Or use alternative methods</span>
        </div>
      </div>

      {/* LinkedIn PDF Upload - ALTERNATIVE */}
      <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/50 hover:bg-muted transition-colors">
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
              <p className="font-semibold text-foreground">Import from LinkedIn PDF</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Go to LinkedIn → Your Profile → Resources → Download Profile as PDF
              </p>
            </div>
            <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold">
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Click to Choose LinkedIn PDF'
              )}
            </div>
          </div>
        </label>
      </div>

      {/* LinkedIn Text Paste */}
      <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-600 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-foreground mb-2">Or paste LinkedIn profile text</p>
            <textarea
              placeholder="Copy your LinkedIn profile text and paste it here..."
              className="w-full h-32 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-background text-foreground"
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

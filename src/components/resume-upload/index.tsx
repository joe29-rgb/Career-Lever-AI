'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Linkedin } from 'lucide-react'
import { Resume } from '@/types'
import toast from 'react-hot-toast'
import { LinkedInImport } from '@/components/linkedin-import'

interface ResumeUploadProps {
  onUploadSuccess: (resume: Resume) => void
  onUploadError: (error: string) => void
  maxFileSize?: number
  acceptedTypes?: string[]
  setKeywords?: (keywords: string[]) => void
  setLocation?: (location: string) => void
}

// PHASE 1: Zero-Friction Automation - Background job search and company research
const triggerAutopilotFlow = async (resume: Resume) => {
  try {
    // Starting autopilot background flow
    
    // Update progress indicator
    const updateProgress = (step: string, status: 'loading' | 'complete') => {
      try {
        const progress = JSON.parse(localStorage.getItem('cf:autopilotProgress') || '{}')
        progress[step] = status
        localStorage.setItem('cf:autopilotProgress', JSON.stringify(progress))
      } catch {}
    }
    
    updateProgress('resume', 'complete')
    
    // PHASE 1B: Extract smart profile (salary, work type, preferences)
    try {
      const profileResponse = await fetch('/api/resume/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume.extractedText })
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        if (profileData.success && profileData.profile) {
          // Cache profile for later use
          localStorage.setItem('cf:profile', JSON.stringify(profileData.profile))
          // Smart profile extracted and cached
        }
      }
    } catch (err) {
      console.warn('[AUTOPILOT] Profile extraction failed (non-critical):', err)
    }
    
    updateProgress('search', 'loading')
    
    // Get location and keywords from localStorage (already extracted by processResumeSignals)
    const location = localStorage.getItem('cf:location') || ''
    const keywords = localStorage.getItem('cf:keywords') || ''
    
    console.log('[AUTOPILOT] Using location:', location, 'keywords:', keywords)
    
    // Searching with extracted location and keywords
    
    // Trigger background job search (fire and forget for speed)
    fetch('/api/jobs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        location,
        useResumeMatching: true,
        limit: 50
      })
    }).then(async (response) => {
      if (response.ok) {
        const jobsData = await response.json()
        const jobs = jobsData.data || []
        
        // Jobs found and cached
        
        // Cache results
        localStorage.setItem('cf:jobResults', JSON.stringify(jobs))
        localStorage.setItem('cf:jobResultsTime', Date.now().toString())
        
        updateProgress('search', 'complete')
        updateProgress('research', 'loading')
        
        // Pre-research top 10 companies (fire and forget)
        const topJobs = jobs.slice(0, 10)
        let researchedCount = 0
        
        topJobs.forEach((job: { company: string; title: string }) => {
          fetch('/api/v2/company/deep-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              companyName: job.company,
              targetRole: job.title 
            })
          }).then(() => {
            researchedCount++
            // Company research completed
            
            if (researchedCount === topJobs.length) {
              updateProgress('research', 'complete')
              updateProgress('optimize', 'loading')
              
              // Show success notification
              toast.success(`🚀 Autopilot complete! Found ${jobs.length} jobs and researched ${topJobs.length} companies.`)
              
              updateProgress('optimize', 'complete')
            }
          }).catch(err => {
            console.warn('[AUTOPILOT] Company research failed for', job.company, err)
          })
        })
        
        // If no jobs to research, mark as complete
        if (topJobs.length === 0) {
          updateProgress('research', 'complete')
          updateProgress('optimize', 'complete')
        }
      } else {
        console.error('[AUTOPILOT] Job search failed:', response.status)
        updateProgress('search', 'complete')
        updateProgress('research', 'complete')
        updateProgress('optimize', 'complete')
      }
    }).catch(error => {
      console.error('[AUTOPILOT] Error:', error)
      // Don't show error to user, just log it
    })
    
  } catch (error) {
    console.error('[AUTOPILOT] Flow error:', error)
    // Silent fail - don't interrupt user experience
  }
}

export function ResumeUpload({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024 // 10MB
}: ResumeUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [activeTab, setActiveTab] = useState<'upload' | 'linkedin' | 'paste'>('upload')

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors.some((error: any) => error.code === 'file-too-large')) {
        setError(`File size too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`)
      } else if (rejection.errors.some((error: any) => error.code === 'file-invalid-type')) {
        setError('Only PDF files are accepted.')
      } else {
        setError('File upload failed. Please try again.')
      }
      return
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFile(file)
      setError(null)
      setUploadedResume(null)
    }
  }, [maxFileSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: maxFileSize,
    disabled: isUploading
  })

  const processResumeSignals = async (resumeText: string) => {
    try {
      const response = await fetch('/api/resume/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          maxKeywords: 50,
          locationHint: 'Edmonton, AB'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Signals API error:', error)
        throw new Error(error.error || 'Signal extraction failed')
      }

      const data = await response.json()

      // Signals extracted successfully

      // Note: Keywords and location are stored in the resume record
      // and can be retrieved from the API response if needed

      return data

    } catch (error) {
      console.error('Signal processing failed:', error)
      toast.error('Could not extract keywords/location. Using defaults.')
      throw error
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile && !pastedText.trim()) {
      setError('Please upload a PDF or paste your resume text')
      toast.error('Please upload a PDF or paste your resume text')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      if (uploadedFile) {
        formData.append('file', uploadedFile) // API expects 'file' not 'resume'
        // Uploading file
      }
      if (pastedText.trim()) {
        formData.append('pastedText', pastedText.trim())
        // Uploading pasted text
      }

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        // Try to read json error with details, otherwise use status text
        let message = 'Upload failed'
        let details = ''
        try { 
          const errorData = await response.json()
          console.error('❌ Upload API error:', errorData)
          message = (errorData as { error?: string }).error || message 
          details = (errorData as { details?: string }).details || ''
        } catch {}
        throw new Error(details ? `${message}: ${details}` : message)
      }

      const data = await response.json()
      // Upload successful
      const resume = data.resume

      if (!resume) {
        throw new Error('Resume upload failed - no resume data returned')
      }
      
      // Store resume in localStorage for immediate use even if DB save fails
      try {
        localStorage.setItem('uploadedResume', JSON.stringify(resume))
        localStorage.setItem('cf:resume', JSON.stringify(resume))
      } catch (e) {
        console.warn('Could not store resume in localStorage:', e)
      }

      setUploadedResume(resume)
      toast.success('Resume uploaded successfully!')
      
      // CRITICAL: Call onUploadSuccess callback
      onUploadSuccess(resume)
      
      // AUTO-SEARCH: Extract keywords and trigger job search
      if (resume.extractedText) {
        // Auto-triggering job search
        try {
          const signalsResp = await fetch('/api/resume/extract-signals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: resume.extractedText }) // CRITICAL FIX: Use correct endpoint and param name
          })
          
          if (signalsResp.ok) {
            const signals = await signalsResp.json()
            // Signals extracted
            
            // PERPLEXITY FIX: Standardized localStorage keys as per audit
            localStorage.setItem('cf:location', signals.location || '') // Standard key for location
            localStorage.setItem('cf:keywords', signals.keywords?.slice(0, 30).join(', ') || '') // FIXED: Use 30 keywords for better job matches
            localStorage.setItem('cf:resume', JSON.stringify(resume)) // Full resume object
            localStorage.setItem('cf:autopilotReady', '1') // Autopilot flag
            
            // Location stored in localStorage
            
            toast.success('Keywords extracted! Redirecting to job search...')
            
            // Redirect to search page - CRITICAL: Only pass location if extracted
            setTimeout(() => {
              const keywords = signals.keywords?.slice(0, 30).join(', ') || ''
              const location = signals.location || ''
              const url = location 
                ? `/career-finder/search?auto=true&keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`
                : `/career-finder/search?auto=true&keywords=${encodeURIComponent(keywords)}`
              window.location.href = url
            }, 1000)
          }
        } catch (err) {
          console.error('Auto-search setup failed:', err)
          // Don't block the upload success
        }
      }

      setUploadedResume(resume)
      // Enable Autopilot preference best-effort
      try { await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: { autopilot: { useResume: true } } }) }) } catch {}

      // Auto-suggest jobs using resume content
      try {
        const resp = await fetch('/api/v2/jobs/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeId: resume._id }) })
        const js = await resp.json()
        if (resp.ok && js.success) {
          try { localStorage.setItem('jobs:lastSuggest', JSON.stringify(js)) } catch {}
          toast.success(`Found ${js.results?.length || 0} local jobs for ${js.titles?.join(', ')}`)
        }
      } catch {}

      // Mark Autopilot ready and move wizard
      try { localStorage.setItem('cf:autopilotReady', '1'); localStorage.setItem('cf:progress', JSON.stringify({ step: 2, total: 7 })) } catch {}
      toast.success('Resume uploaded successfully! Autopilot enabled.')

      // Extract signals after upload
      if (data.extractedText && data.extractedText.length > 50) {
        await processResumeSignals(data.extractedText)
      }

      // PHASE 1: Zero-Friction Automation - Trigger full autopilot flow
      if (data.extractedText && data.extractedText.length > 100) {
        triggerAutopilotFlow(data)
      }

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onUploadError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setUploadedResume(null)
    setError(null)
    setUploadProgress(0)
    setPastedText('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="space-y-4 p-0">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Upload className="inline-block w-4 h-4 mr-2" />
            Upload PDF
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'linkedin'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Linkedin className="inline-block w-4 h-4 mr-2" />
            LinkedIn
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Paste Text
          </button>
        </div>

        {/* Error Alert - VIBRANT */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && !uploadedFile && (
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-primary gradient-card-blue scale-105'
                : 'border-border hover:border-primary hover:gradient-card-blue'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center shadow-lg">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-bold text-foreground">
                {isDragActive ? '📥 Drop it here!' : '📄 Upload Your Resume'}
              </p>
              <p className="text-base text-muted-foreground font-medium">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Maximum file size: {maxFileSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        )}

        {/* LinkedIn Tab */}
        {activeTab === 'linkedin' && !uploadedFile && (
          <LinkedInImport
            onImport={async (resumeData) => {
              try {
                // The LinkedIn import component already uploaded to the API
                // Just trigger the success callback
                onUploadSuccess(resumeData)
                setUploadedResume(resumeData)
                toast.success('LinkedIn resume imported successfully!')
              } catch (error) {
                console.error('LinkedIn import error:', error)
                toast.error('Failed to import LinkedIn resume')
              }
            }}
          />
        )}

        {/* Paste Tab */}
        {activeTab === 'paste' && !uploadedFile && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-base font-bold text-foreground flex items-center gap-2">
                ✍️ Paste your resume text
              </label>
              <textarea
                className="modern-input w-full h-64 resize-none text-sm"
                placeholder="Paste your resume here if your PDF is scanned or not readable..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isUploading}
              />
              <div className="text-sm text-muted-foreground font-medium">✨ We&apos;ll create a resume record from your pasted text.</div>
            </div>

            {pastedText.trim() && !isUploading && !uploadedResume && (
              <div className="flex gap-3">
                <Button 
                  onClick={handleUpload} 
                  className="flex-1 btn-gradient py-4 text-base border-0"
                >
                  🚀 Upload Resume
                </Button>
                <Button variant="outline" onClick={clearFile}>
                  Cancel
                </Button>
              </div>
            )}

            {isUploading && (
              <div className="flex gap-3">
                <Button disabled className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold py-4 rounded-2xl border-0 text-base">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </Button>
                <Button variant="outline" disabled className="border-2 border-gray-300 rounded-2xl font-bold py-4 px-6 opacity-50">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* File Preview (shown when file is uploaded) */}
        {uploadedFile && (
          /* File Preview */
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                </div>
              </div>
              {!isUploading && !uploadedResume && (
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Uploading...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Paste Text Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Or paste your resume text</label>
              <textarea
                className="w-full border rounded-md p-3 text-sm h-40"
                placeholder="Paste your resume here if your PDF is scanned or not readable..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isUploading}
              />
              <div className="text-xs text-muted-foreground">We’ll create a resume record from your pasted text.</div>
            </div>

            {/* Upload Button */}
            {(uploadedFile || pastedText.trim()) && !isUploading && !uploadedResume && (
              <div className="mt-4 flex gap-2">
                <Button onClick={handleUpload} className="flex-1">
                  Upload Resume
                </Button>
                <Button variant="outline" onClick={clearFile}>
                  Cancel
                </Button>
              </div>
            )}

            {uploadedFile && isUploading && (
              <div className="mt-4 flex gap-2">
                <Button disabled className="flex-1">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </Button>
                <Button variant="outline" disabled>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {uploadedResume && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Resume uploaded and processed successfully!</span>
              <div className="flex items-center gap-2">
                <a href="/jobs" className="text-xs px-2 py-1 border rounded">Find Jobs Near Me</a>
                <Badge variant="secondary">Ready for customization</Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Resume Preview */}
        {uploadedResume && (
          <div className="bg-card rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Resume Preview</h4>
            <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
              {uploadedResume.extractedText.substring(0, 300)}...
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {uploadedResume.extractedText.split(' ').length} words extracted
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



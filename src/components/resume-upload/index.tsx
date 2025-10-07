'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Resume } from '@/types'
import toast from 'react-hot-toast'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'

interface ResumeUploadProps {
  onUploadSuccess: (resume: Resume) => void
  onUploadError: (error: string) => void
  maxFileSize?: number
  acceptedTypes?: string[]
  setKeywords?: (keywords: string[]) => void
  setLocation?: (location: string) => void
}

export function ResumeUpload({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['application/pdf']
}: ResumeUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [clientExtract, setClientExtract] = useState('')
  const { toast } = useToast()

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

  const extractPdfClientSide = async (file: File): Promise<string> => {
    try {
      // Server-side PDF extraction via API call
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'PDF upload failed')
      }

      const result = await response.json()
      return result.extractedText || ''
    } catch (error) {
      console.warn('PDF extraction failed:', error)
      return ''
    }
  }

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

      console.log('Extracted signals:', data)

      // Note: Keywords and location are stored in the resume record
      // and can be retrieved from the API response if needed

      return data

    } catch (error) {
      console.error('Signal processing failed:', error)
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract keywords/location. Using defaults.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile && !pastedText.trim()) {
      setError('Please upload a PDF or paste your resume text')
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
        // Try client-side extraction first
        const clientText = clientExtract || await extractPdfClientSide(uploadedFile)
        if (clientText && clientText.length >= 50) {
          formData.append('clientText', clientText)
          setClientExtract(clientText)
        }
        formData.append('resume', uploadedFile)
      }
      if (pastedText.trim()) formData.append('pastedText', pastedText.trim())

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        // Try to read json error, otherwise use status text
        let message = 'Upload failed'
        try { const errorData = await response.json(); message = (errorData as any).error || message } catch {}
        throw new Error(message)
      }

      const data = await response.json()
      const resume = data.resume

      setUploadedResume(resume)
      onUploadSuccess(resume)
      // Enable Autopilot preference best-effort
      try { await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: { autopilot: { useResume: true } } }) }) } catch {}

      // Auto-suggest jobs using resume content
      try {
        const resp = await fetch('/api/v2/jobs/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeId: resume._id }) })
        const js = await resp.json()
        if (resp.ok && js.success) {
          try { localStorage.setItem('jobs:lastSuggest', JSON.stringify(js)) } catch {}
          toast({
            title: `Found ${js.results?.length || 0} local jobs for ${js.titles?.join(', ')}`,
            variant: 'default'
          })
        }
      } catch {}

      // Mark Autopilot ready and move wizard
      try { localStorage.setItem('cf:autopilotReady', '1'); localStorage.setItem('cf:progress', JSON.stringify({ step: 2, total: 7 })) } catch {}
      toast({ title: "Success", description: 'Resume uploaded successfully! Autopilot enabled.', variant: "default" })

      // Extract signals after upload
      if (data.extractedText && data.extractedText.length > 50) {
        await processResumeSignals(data.extractedText)
      }

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onUploadError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
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

        {/* VIBRANT Upload Area */}
        {!uploadedFile ? (
          <>
            <div
              {...getRootProps()}
              className={`border-3 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-primary gradient-card-blue scale-105'
                  : 'border-border hover:border-primary hover:gradient-card-blue'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              {/* Modern upload icon */}
              <div className="w-20 h-20 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center shadow-lg">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-bold text-gray-900">
                  {isDragActive ? '📥 Drop it here!' : '📄 Upload Your Resume'}
                </p>
                <p className="text-base text-gray-600 font-medium">
                  Drag and drop your PDF file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: {maxFileSize / (1024 * 1024)}MB
                </p>
              </div>
            </div>

            {/* VIBRANT Paste Text Area */}
            <div className="space-y-3 mt-6">
              <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                ✍️ Or paste your resume text
              </label>
              <textarea
                className="modern-input w-full h-40 resize-none text-sm"
                placeholder="Paste your resume here if your PDF is scanned or not readable..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isUploading}
              />
              <div className="text-sm text-gray-600 font-medium">✨ We'll create a resume record from your pasted text.</div>
            </div>

            {/* VIBRANT Upload Button when using pasted text */}
            {(pastedText.trim()) && !isUploading && !uploadedResume && (
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleUpload} 
                  className="flex-1 btn-gradient py-4 text-base border-0"
                >
                  🚀 Upload Resume
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearFile}
                  className="border-2 border-gray-300 rounded-2xl font-bold hover:border-red-500 hover:text-red-500 transition-colors py-4 px-6"
                >
                  Cancel
                </Button>
              </div>
            )}

            {isUploading && (
              <div className="mt-6 flex gap-3">
                <Button disabled className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold py-4 rounded-2xl border-0 text-base">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </Button>
                <Button variant="outline" disabled className="border-2 border-gray-300 rounded-2xl font-bold py-4 px-6 opacity-50">
                  Cancel
                </Button>
              </div>
            )}
          </>
        ) : (
          /* File Preview */
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(uploadedFile.size)}</p>
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
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Paste Text Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Or paste your resume text</label>
              <textarea
                className="w-full border rounded-md p-3 text-sm h-40"
                placeholder="Paste your resume here if your PDF is scanned or not readable..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={isUploading}
              />
              <div className="text-xs text-gray-500">We’ll create a resume record from your pasted text.</div>
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resume Preview</h4>
            <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
              {uploadedResume.extractedText.substring(0, 300)}...
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {uploadedResume.extractedText.split(' ').length} words extracted
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



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

interface ResumeUploadProps {
  onUploadSuccess: (resume: Resume) => void
  onUploadError: (error: string) => void
  maxFileSize?: number
  acceptedTypes?: string[]
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

  const handleUpload = async () => {
    if (!uploadedFile) return

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
      formData.append('resume', uploadedFile)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      const resume = data.resume

      setUploadedResume(resume)
      onUploadSuccess(resume)

      toast.success('Resume uploaded successfully!')

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
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Resume Upload
        </CardTitle>
        <CardDescription>
          Upload your resume in PDF format for AI-powered customization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </p>
              <p className="text-sm text-gray-600">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Maximum file size: {maxFileSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
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

            {/* Upload Button */}
            {uploadedFile && !isUploading && !uploadedResume && (
              <div className="mt-4 flex gap-2">
                <Button onClick={handleUpload} className="flex-1">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload Resume
                </Button>
                <Button variant="outline" onClick={clearFile}>
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
              <Badge variant="secondary">Ready for customization</Badge>
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


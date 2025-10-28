'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Linkedin, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

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
    id: string
    company: string
    position: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    description: string
    achievements: string[]
    technologies: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    location: string
    graduationDate: string
    gpa?: string
    honors?: string[]
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages: Array<{ language: string; proficiency: string }>
    certifications: Array<{ name: string; issuer: string; date: string }>
  }
  projects: Array<{
    id: string
    name: string
    description: string
    technologies: string[]
    url?: string
    startDate: string
    endDate: string
  }>
}

interface LinkedInUrlImportProps {
  onImport: (data: ResumeData) => void
  className?: string
}

export function LinkedInUrlImport({ onImport, className = '' }: LinkedInUrlImportProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateUrl = (url: string): boolean => {
    return url.includes('linkedin.com/in/') || url.includes('linkedin.com/pub/')
  }

  const handleImport = async () => {
    if (!validateUrl(url)) {
      setError('Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      console.log('[LINKEDIN_URL_IMPORT] Scraping:', url)
      
      const response = await fetch('/api/resume/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import LinkedIn profile')
      }

      const data = await response.json()
      console.log('[LINKEDIN_URL_IMPORT] Success:', data)

      if (data.success && data.resumeData) {
        setSuccess(true)
        toast.success('LinkedIn profile imported successfully!')
        onImport(data.resumeData)
        
        // Reset after 2 seconds
        setTimeout(() => {
          setSuccess(false)
          setUrl('')
        }, 2000)
      } else {
        throw new Error('No data returned from LinkedIn')
      }
    } catch (err) {
      const errorMessage = (err as Error).message
      console.error('[LINKEDIN_URL_IMPORT] Error:', errorMessage)
      setError(errorMessage)
      toast.error('Failed to import LinkedIn profile')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url && !loading) {
      handleImport()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
        <div className="flex gap-2">
          <Input
            id="linkedin-url"
            type="url"
            placeholder="https://linkedin.com/in/yourname"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError('')
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleImport}
            disabled={loading || !url}
            className="gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Imported!
              </>
            ) : (
              <>
                <Linkedin className="w-4 h-4" />
                Import
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Tip: Make sure your LinkedIn profile is set to public
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Successfully imported your LinkedIn profile! 🎉
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

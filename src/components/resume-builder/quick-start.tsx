'use client'

import { useState } from 'react'
import { Upload, Linkedin, Wand2, Loader2, CheckCircle } from 'lucide-react'

interface QuickStartProps {
  onResumeImported: (data: any) => void
}

export function QuickStart({ onResumeImported }: QuickStartProps) {
  const [uploading, setUploading] = useState(false)
  const [linkedinConnecting, setLinkedinConnecting] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        onResumeImported(data)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleLinkedInImport = async () => {
    setLinkedinConnecting(true)
    try {
      // TODO: Implement LinkedIn OAuth
      // For now, show coming soon message
      alert('LinkedIn import coming soon! For now, please upload your resume or start from scratch.')
    } finally {
      setLinkedinConnecting(false)
    }
  }

  const handleAIStart = () => {
    // Start with empty template
    onResumeImported(null)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          How would you like to start?
        </h2>
        <p className="text-lg text-gray-600">
          Choose the fastest way to build your professional resume
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Option 1: Upload Resume */}
        <div className="relative bg-card rounded-2xl p-8 border-2 border-border hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 transition-colors">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin group-hover:text-white" />
              ) : (
                <Upload className="w-8 h-8 text-blue-600 group-hover:text-white" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">Upload Your Resume</h3>
            <p className="text-sm text-gray-600 mb-4">
              Have a resume? We'll import it and make it better
            </p>
            
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Auto-extract all sections</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI enhancement suggestions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Ready in 30 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Option 2: LinkedIn Import (Featured) */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 border-2 border-transparent hover:shadow-2xl transition-all cursor-pointer group">
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
              Most Popular
            </span>
          </div>
          
          <button
            onClick={handleLinkedInImport}
            disabled={linkedinConnecting}
            className="w-full text-center"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-card/30 transition-colors">
              {linkedinConnecting ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Linkedin className="w-8 h-8 text-white" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Import from LinkedIn</h3>
            <p className="text-sm text-white/90 mb-4">
              Already on LinkedIn? Import your profile instantly
            </p>
            
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="w-4 h-4" />
                <span>One-click import</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="w-4 h-4" />
                <span>All details pre-filled</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white">
                <CheckCircle className="w-4 h-4" />
                <span>Zero typing required</span>
              </div>
            </div>
          </button>
        </div>

        {/* Option 3: AI-Guided Build */}
        <div className="relative bg-card rounded-2xl p-8 border-2 border-border hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer group">
          <button onClick={handleAIStart} className="w-full text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500 transition-colors">
              <Wand2 className="w-8 h-8 text-purple-600 group-hover:text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">AI-Guided Resume</h3>
            <p className="text-sm text-gray-600 mb-4">
              Starting fresh? AI will help you write everything
            </p>
            
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI writes for you</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Smart suggestions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Optimized for ATS</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          All options include AI-powered enhancements and ATS optimization
        </p>
      </div>
    </div>
  )
}

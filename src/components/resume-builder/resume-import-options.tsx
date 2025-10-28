'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LinkedInUrlImport } from './linkedin-url-import'
import { Linkedin, Upload, Sparkles, ArrowRight } from 'lucide-react'

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

interface ResumeImportOptionsProps {
  onImport: (data: ResumeData | null) => void
  onSkip?: () => void
}

export function ResumeImportOptions({ onImport, onSkip }: ResumeImportOptionsProps) {
  const [activeTab, setActiveTab] = useState('linkedin')

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl">
          Let&apos;s build your resume in 5 minutes! ✨
        </CardTitle>        <CardDescription className="text-base">
          Choose how you&apos;d like to start - we&apos;ll handle the rest with AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="w-4 h-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="scratch" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Start Fresh</span>
            </TabsTrigger>
          </TabsList>

          {/* LinkedIn Import */}
          <TabsContent value="linkedin" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🚀 Fastest Method (Recommended)
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Paste your LinkedIn profile URL and we&apos;ll automatically extract all your information. 
                Takes less than 30 seconds!
              </p>
            </div>
            
            <LinkedInUrlImport onImport={onImport} />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Extracts work experience, education, and skills</p>
              <p>✓ No LinkedIn login required</p>
              <p>✓ Works with public profiles</p>
            </div>
          </TabsContent>

          {/* Resume Upload */}
          <TabsContent value="upload" className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                📄 Have an existing resume?
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Upload your current resume (PDF or DOCX) and we&apos;ll extract all the data automatically.
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium mb-1">Drag & drop your resume here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground">
                Supports PDF and DOCX • Max 10MB
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ AI extracts all information automatically</p>
              <p>✓ Supports PDF and Microsoft Word</p>
              <p>✓ Your data stays private and secure</p>
            </div>
          </TabsContent>

          {/* Start from Scratch */}
          <TabsContent value="scratch" className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ✨ AI-Guided Resume Building
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                Start with a blank slate. Our AI will guide you step-by-step and help write 
                professional achievement bullets.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Enter basic info</p>
                  <p className="text-xs text-muted-foreground">Name, email, phone, location</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Add work experience</p>
                  <p className="text-xs text-muted-foreground">AI helps write achievement bullets</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Choose template & download</p>
                  <p className="text-xs text-muted-foreground">9 professional templates available</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => onImport(null)} 
              className="w-full gap-2"
              size="lg"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ AI-powered achievement generator</p>
              <p>✓ Step-by-step guidance</p>
              <p>✓ Takes about 10-15 minutes</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Skip Option */}
        {onSkip && (
          <div className="mt-6 pt-6 border-t text-center">
            <Button 
              variant="ghost" 
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

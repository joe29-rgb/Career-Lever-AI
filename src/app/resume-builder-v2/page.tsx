'use client'

import { useState, useEffect } from 'react'
import { QuickStart } from '@/components/resume-builder/quick-start'
import { TemplateSelector } from '@/components/resume-builder/template-selector'
import { ResumePreview } from '@/components/resume-builder/resume-preview'
import { BulletPointGenerator } from '@/components/resume-builder/bullet-point-generator'
import { ATSChecker } from '@/components/resume-builder/ats-checker'
import { ProgressTracker } from '@/components/resume-builder/progress-tracker'
import { ExportHub } from '@/components/resume-builder/export-hub'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react'

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
    achievements: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    graduationDate: string
  }>
  skills: {
    technical: string[]
    soft: string[]
  }
}

const EMPTY_RESUME: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: ''
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: []
  }
}

export default function ResumeBuilderV2Page() {
  const [step, setStep] = useState<'quick-start' | 'builder'>('quick-start')
  const [resume, setResume] = useState<ResumeData>(EMPTY_RESUME)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [activeSection, setActiveSection] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal')
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null)

  const handleResumeImported = (data: any) => {
    if (data) {
      setResume(data)
    }
    setStep('builder')
  }

  const updatePersonalInfo = (field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }))
  }

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      achievements: []
    }
    setResume(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }))
    setEditingExpIndex(resume.experience.length)
  }

  const updateExperience = (index: number, field: string, value: any) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addAchievement = (expIndex: number, achievement: string) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIndex
          ? { ...exp, achievements: [...exp.achievements, achievement] }
          : exp
      )
    }))
  }

  const removeExperience = (index: number) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      graduationDate: ''
    }
    setResume(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (index: number) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const addSkill = (type: 'technical' | 'soft', skill: string) => {
    if (!skill.trim()) return
    setResume(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: [...prev.skills[type], skill.trim()]
      }
    }))
  }

  const removeSkill = (type: 'technical' | 'soft', index: number) => {
    setResume(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: prev.skills[type].filter((_, i) => i !== index)
      }
    }))
  }

  if (step === 'quick-start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              ✨ AI-Powered Resume Builder
            </h1>
            <p className="text-xl text-gray-600">
              Create a professional, ATS-optimized resume in minutes
            </p>
          </div>

          <QuickStart onResumeImported={handleResumeImported} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-blue-100">Build your perfect resume with AI assistance</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setStep('quick-start')}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-card/20"
            >
              ← Start Over
            </Button>
            <Button className="bg-card text-blue-600 hover:bg-blue-50">
              <Save className="w-4 h-4 mr-2" />
              Save Resume
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Template Selector */}
        <div className="mb-8">
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />
        </div>

        {/* Main Builder Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Editor (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Tabs */}
            <div className="bg-card rounded-xl border-2 border-border p-2 flex gap-2">
              {(['personal', 'experience', 'education', 'skills'] as const).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    activeSection === section
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>

            {/* Personal Info Section */}
            {activeSection === 'personal' && (
              <div className="bg-card rounded-xl border-2 border-border p-6 space-y-4">
                <h3 className="text-xl font-bold text-foreground">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      value={resume.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={resume.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone *
                    </label>
                    <Input
                      value={resume.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      value={resume.personalInfo.location}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <Input
                      value={resume.personalInfo.linkedin}
                      onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Website
                    </label>
                    <Input
                      value={resume.personalInfo.website}
                      onChange={(e) => updatePersonalInfo('website', e.target.value)}
                      placeholder="johndoe.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Summary
                  </label>
                  <Textarea
                    value={resume.personalInfo.summary}
                    onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                    placeholder="A brief summary of your professional background and key achievements..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={() => setActiveSection('experience')}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Next: Add Experience <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Experience Section */}
            {activeSection === 'experience' && (
              <div className="space-y-6">
                {resume.experience.map((exp, index) => (
                  <div key={exp.id} className="bg-card rounded-xl border-2 border-border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-foreground">
                        Experience #{index + 1}
                      </h4>
                      <Button
                        onClick={() => removeExperience(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Position
                        </label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          placeholder="Software Engineer"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company
                        </label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          placeholder="Tech Corp"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Location
                        </label>
                        <Input
                          value={exp.location}
                          onChange={(e) => updateExperience(index, 'location', e.target.value)}
                          placeholder="San Francisco, CA"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date
                        </label>
                        <Input
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          placeholder="Jan 2020"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date
                        </label>
                        <Input
                          value={exp.endDate}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          placeholder="Present"
                          disabled={exp.current}
                        />
                      </div>
                      
                      <div className="flex items-center pt-8">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">Currently working here</label>
                      </div>
                    </div>

                    {/* AI Bullet Generator */}
                    <BulletPointGenerator
                      role={exp.position}
                      company={exp.company}
                      achievements={exp.achievements}
                      onAddBullet={(bullet) => addAchievement(index, bullet)}
                    />

                    {/* Achievements List */}
                    {exp.achievements.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-2">Achievements:</h5>
                        <ul className="space-y-2">
                          {exp.achievements.map((achievement, achIndex) => (
                            <li key={achIndex} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">• {achievement}</span>
                              <button
                                onClick={() => {
                                  const newAchievements = exp.achievements.filter((_, i) => i !== achIndex)
                                  updateExperience(index, 'achievements', newAchievements)
                                }}
                                className="ml-auto text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  onClick={addExperience}
                  variant="outline"
                  className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Experience
                </Button>

                <Button
                  onClick={() => setActiveSection('education')}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Next: Add Education <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Education & Skills sections would go here - keeping it concise */}
            
            {/* Export Hub */}
            <ExportHub resume={resume} />
          </div>

          {/* Right: Preview & Tools (1 column) */}
          <div className="space-y-6">
            <ResumePreview resume={resume} template={selectedTemplate} />
            <ProgressTracker resume={resume} />
            <ATSChecker resume={resume} />
          </div>
        </div>
      </div>
    </div>
  )
}

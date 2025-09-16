'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  Eye,
  Download,
  Wand2,
  Palette,
  Type,
  Layout,
  CheckCircle,
  AlertTriangle,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Code,
  Briefcase,
  BookOpen,
  FileText,
  Lightbulb
} from 'lucide-react'
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
    certifications: Array<{ name: string; issuer: string; date: string; expiry?: string }>
  }
  projects: Array<{
    id: string
    name: string
    description: string
    technologies: string[]
    url?: string
    github?: string
    startDate: string
    endDate: string
  }>
}

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary design with subtle colors',
    preview: '🎨 Modern gradient header with clean typography',
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional layout perfect for corporate roles',
    preview: '📋 Classic format with serif typography',
    color: 'from-gray-700 to-gray-900'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative and marketing roles',
    preview: '✨ Colorful accents with creative layout',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'tech',
    name: 'Tech-Focused',
    description: 'Optimized for technology and engineering roles',
    preview: '💻 Code-friendly with technical emphasis',
    color: 'from-green-500 to-teal-600'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, distraction-free design',
    preview: '🎯 Simple and elegant layout',
    color: 'from-gray-500 to-gray-700'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Sophisticated design for senior leadership',
    preview: '🏆 Premium layout for executive positions',
    color: 'from-indigo-600 to-purple-800'
  }
]

interface ResumeBuilderProps {
  userId: string
}

export function ResumeBuilder({ userId }: ResumeBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [resumeData, setResumeData] = useState<ResumeData>({
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
      soft: [],
      languages: [],
      certifications: []
    },
    projects: [{
      id: '1',
      name: '',
      description: '',
      technologies: [],
      url: '',
      github: '',
      startDate: '',
      endDate: ''
    }]
  })

  const [activeSection, setActiveSection] = useState('personal')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResume, setGeneratedResume] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Load existing resume data if available
  useEffect(() => {
    loadExistingResume()
  }, [])

  const loadExistingResume = async () => {
    try {
      const response = await fetch('/api/resume/list')
      if (response.ok) {
        const data = await response.json()
        if (data.resumes && data.resumes.length > 0) {
          // Load the most recent resume
          const recentResume = data.resumes[0]
          // This would parse the existing resume data
          toast.success('Loaded existing resume data')
        }
      }
    } catch (error) {
      console.error('Failed to load existing resume:', error)
    }
  }

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
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
      description: '',
      achievements: [],
      technologies: []
    }
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }))
  }

  const updateExperience = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    setResumeData(prev => {
      const newExp = [...prev.experience]
      if (direction === 'up' && index > 0) {
        [newExp[index], newExp[index - 1]] = [newExp[index - 1], newExp[index]]
      } else if (direction === 'down' && index < newExp.length - 1) {
        [newExp[index], newExp[index + 1]] = [newExp[index + 1], newExp[index]]
      }
      return { ...prev, experience: newExp }
    })
  }

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      location: '',
      graduationDate: '',
      gpa: '',
      honors: []
    }
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const updateEducation = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const addSkill = (category: 'technical' | 'soft', skill: string) => {
    if (!skill.trim()) return

    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...prev.skills[category], skill.trim()]
      }
    }))
  }

  const removeSkill = (category: 'technical' | 'soft', skillToRemove: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter(skill => skill !== skillToRemove)
      }
    }))
  }

  const addLanguage = () => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: [...prev.skills.languages, { language: '', proficiency: 'Beginner' }]
      }
    }))
  }

  const updateLanguage = (index: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: prev.skills.languages.map((lang, i) =>
          i === index ? { ...lang, [field]: value } : lang
        )
      }
    }))
  }

  const removeLanguage = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        languages: prev.skills.languages.filter((_, i) => i !== index)
      }
    }))
  }

  const addProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      url: '',
      github: '',
      startDate: '',
      endDate: ''
    }
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }))
  }

  const updateProject = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      )
    }))
  }

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }))
  }

  const addProjectTechnology = (projectId: string, technology: string) => {
    if (!technology.trim()) return

    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === projectId
          ? { ...project, technologies: [...project.technologies, technology.trim()] }
          : project
      )
    }))
  }

  const removeProjectTechnology = (projectId: string, technologyToRemove: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === projectId
          ? { ...project, technologies: project.technologies.filter(tech => tech !== technologyToRemove) }
          : project
      )
    }))
  }

  const generateResume = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/resume-builder/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          template: selectedTemplate,
          targetJob: 'Software Engineer', // This could be dynamic
          industry: 'Technology',
          experienceLevel: 'mid'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate resume')
      }

      const data = await response.json()
      setGeneratedResume(data)
      setShowPreview(true)
      toast.success('Resume generated successfully!')
    } catch (error) {
      console.error('Resume generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate resume')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadResume = () => {
    if (!generatedResume) return

    // Create and download HTML file
    const blob = new Blob([generatedResume.output.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Resume downloaded!')
  }

  const calculateCompleteness = () => {
    let score = 0
    let total = 0

    // Personal info (25%)
    total += 25
    if (resumeData.personalInfo.fullName) score += 8
    if (resumeData.personalInfo.email) score += 8
    if (resumeData.personalInfo.phone) score += 5
    if (resumeData.personalInfo.summary) score += 4

    // Experience (30%)
    total += 30
    if (resumeData.experience.length > 0) {
      score += Math.min(resumeData.experience.length * 10, 30)
    }

    // Education (20%)
    total += 20
    if (resumeData.education.length > 0) {
      score += Math.min(resumeData.education.length * 10, 20)
    }

    // Skills (20%)
    total += 20
    const skillCount = resumeData.skills.technical.length + resumeData.skills.soft.length
    score += Math.min(skillCount * 3, 20)

    // Projects (10%)
    total += 10
    if (resumeData.projects && resumeData.projects.length > 0) {
      score += Math.min(resumeData.projects.length * 2, 10)
    }

    return Math.round((score / total) * 100)
  }

  const completeness = calculateCompleteness()

  return (
    <div className="space-y-8">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Template
          </CardTitle>
          <CardDescription>
            Select a professional template that matches your style and industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full h-20 bg-gradient-to-br ${template.color} rounded mb-3 flex items-center justify-center`}>
                  <span className="text-white font-semibold">{template.name}</span>
                </div>
                <h4 className="font-medium mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <p className="text-xs text-gray-500">{template.preview}</p>
                {selectedTemplate === template.id && (
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Builder Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Sections */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resume Content</CardTitle>
              <CardDescription>
                Build your resume section by section. Completeness: {completeness}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>

                {/* Personal Information */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={resumeData.personalInfo.fullName}
                        onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={resumeData.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={resumeData.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={resumeData.personalInfo.location}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={resumeData.personalInfo.linkedin}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/johndoe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={resumeData.personalInfo.website}
                        onChange={(e) => updatePersonalInfo('website', e.target.value)}
                        placeholder="https://johndoe.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={resumeData.personalInfo.summary}
                      onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                      placeholder="Brief summary of your professional background and goals..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* Experience Section */}
                <TabsContent value="experience" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Work Experience</h3>
                    <Button onClick={addExperience} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>

                  {resumeData.experience.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No work experience added yet.</p>
                      <Button onClick={addExperience} className="mt-4">
                        Add Your First Experience
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <Card key={exp.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Experience {index + 1}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveExperience(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveExperience(index, 'down')}
                                  disabled={index === resumeData.experience.length - 1}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeExperience(exp.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <Input
                                placeholder="Job Title"
                                value={exp.position}
                                onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                              />
                              <Input
                                placeholder="Company Name"
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              />
                              <Input
                                placeholder="Location"
                                value={exp.location}
                                onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="month"
                                  placeholder="Start Date"
                                  value={exp.startDate}
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                />
                                <Input
                                  type="month"
                                  placeholder="End Date"
                                  value={exp.endDate}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  disabled={exp.current}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Textarea
                                placeholder="Job description and responsibilities..."
                                value={exp.description}
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                rows={3}
                              />
                              <Input
                                placeholder="Technologies used (comma-separated)"
                                value={exp.technologies.join(', ')}
                                onChange={(e) => updateExperience(exp.id, 'technologies', e.target.value.split(',').map(s => s.trim()))}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Education Section */}
                <TabsContent value="education" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Education</h3>
                    <Button onClick={addEducation} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>

                  {resumeData.education.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No education added yet.</p>
                      <Button onClick={addEducation} className="mt-4">
                        Add Education
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumeData.education.map((edu) => (
                        <Card key={edu.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <span className="font-medium">Education</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeEducation(edu.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <Input
                                placeholder="Institution"
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              />
                              <Input
                                placeholder="Degree"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              />
                              <Input
                                placeholder="Field of Study"
                                value={edu.field}
                                onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                              />
                              <Input
                                placeholder="Location"
                                value={edu.location}
                                onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                              />
                              <Input
                                type="month"
                                placeholder="Graduation Date"
                                value={edu.graduationDate}
                                onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                              />
                              <Input
                                placeholder="GPA (optional)"
                                value={edu.gpa}
                                onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Skills Section */}
                <TabsContent value="skills" className="space-y-6">
                  {/* Technical Skills */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {resumeData.skills.technical.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => removeSkill('technical', skill)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add technical skill"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill('technical', (e.target as HTMLInputElement).value)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add technical skill"]') as HTMLInputElement
                          if (input?.value) {
                            addSkill('technical', input.value)
                            input.value = ''
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Soft Skills */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Soft Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {resumeData.skills.soft.map((skill, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => removeSkill('soft', skill)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add soft skill"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill('soft', (e.target as HTMLInputElement).value)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add soft skill"]') as HTMLInputElement
                          if (input?.value) {
                            addSkill('soft', input.value)
                            input.value = ''
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium">Languages</h3>
                      <Button onClick={addLanguage} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Language
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {resumeData.skills.languages.map((lang, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="Language"
                            value={lang.language}
                            onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                            className="flex-1"
                          />
                          <Select
                            value={lang.proficiency}
                            onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                              <SelectItem value="Native">Native</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeLanguage(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Projects Section */}
                <TabsContent value="projects" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Projects</h3>
                    <Button onClick={addProject} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                  </div>

                  {resumeData.projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No projects added yet.</p>
                      <Button onClick={addProject} className="mt-4">
                        Add Your First Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumeData.projects.map((project, index) => (
                        <Card key={project.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Project {index + 1}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeProject(project.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <Input
                                placeholder="Project Name"
                                value={project.name}
                                onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="month"
                                  placeholder="Start Date"
                                  value={project.startDate}
                                  onChange={(e) => updateProject(project.id, 'startDate', e.target.value)}
                                />
                                <Input
                                  type="month"
                                  placeholder="End Date"
                                  value={project.endDate}
                                  onChange={(e) => updateProject(project.id, 'endDate', e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Textarea
                                placeholder="Project description and your role..."
                                value={project.description}
                                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                rows={3}
                              />

                              {/* Technologies */}
                              <div>
                                <Label className="text-sm font-medium">Technologies Used</Label>
                                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                  {project.technologies.map((tech, techIndex) => (
                                    <Badge key={techIndex} variant="secondary" className="flex items-center gap-1">
                                      {tech}
                                      <button
                                        onClick={() => removeProjectTechnology(project.id, tech)}
                                        className="ml-1 hover:text-red-500"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add technology"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        addProjectTechnology(project.id, (e.target as HTMLInputElement).value)
                                        ;(e.target as HTMLInputElement).value = ''
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const input = document.querySelector(`input[placeholder="Add technology"]`) as HTMLInputElement
                                      if (input?.value) {
                                        addProjectTechnology(project.id, input.value)
                                        input.value = ''
                                      }
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>

                              {/* Links */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  placeholder="Live Demo URL (optional)"
                                  value={project.url}
                                  onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                                />
                                <Input
                                  placeholder="GitHub Repository (optional)"
                                  value={project.github}
                                  onChange={(e) => updateProject(project.id, 'github', e.target.value)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Resume Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                {generatedResume && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedResume && showPreview ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={generatedResume.output.html}
                    className="w-full h-96 border-0"
                    title="Resume Preview"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Generate your resume to see the preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate & Download */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Resume</CardTitle>
              <CardDescription>
                Create your professional resume with AI optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Completeness Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Resume Completeness</span>
                  <span className={completeness >= 80 ? 'text-green-600' : completeness >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                    {completeness}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      completeness >= 80 ? 'bg-green-500' : completeness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                {completeness < 80 && (
                  <p className="text-sm text-gray-600">
                    Add more details to improve your resume's completeness score.
                  </p>
                )}
              </div>

              <Button
                onClick={generateResume}
                disabled={isGenerating || completeness < 30}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Resume
                  </>
                )}
              </Button>

              {generatedResume && (
                <div className="space-y-2">
                  <Button
                    onClick={downloadResume}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download HTML
                  </Button>
                  <p className="text-xs text-gray-600 text-center">
                    Professional templates with ATS optimization
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Resume Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Use action verbs and quantify achievements
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Keep it to 1-2 pages for most roles
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Tailor keywords to the job description
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Include relevant certifications and skills
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

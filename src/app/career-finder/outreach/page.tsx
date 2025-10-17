'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import CareerFinderStorage from '@/lib/career-finder-storage'
import { Mail, Phone, Linkedin, ExternalLink, Building2, User, Briefcase, Copy, Check } from 'lucide-react'

interface HiringContact {
  name: string
  title: string
  department?: string
  linkedinUrl?: string
  email?: string
  phone?: string
  authority?: string
  contactMethod?: string
}

interface EnhancedResearch {
  companyIntelligence: {
    name: string
    industry?: string
    website?: string
  }
  hiringContactIntelligence: {
    officialChannels?: {
      careersPage?: string
      jobsEmail?: string
      hrEmail?: string
      phone?: string
    }
    keyContacts?: HiringContact[]
    emailFormat?: string
    socialMedia?: {
      linkedin?: string
      twitter?: string
      facebook?: string
    }
  }
  strategicRecommendations?: {
    contactStrategy?: string
    applicationStrategy?: string
  }
}

export default function CareerFinderOutreachPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [jobData, setJobData] = useState<any>(null)
  const [companyData, setCompanyData] = useState<EnhancedResearch | null>(null)
  const [selectedContact, setSelectedContact] = useState<HiringContact | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    CareerFinderStorage.setProgress(7, 7)
    loadDataAndGenerateEmail()
  }, [])

  const handleCompleteApplication = async () => {
    if (!jobData) return

    try {
      // Create application record
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobData.id,
          company: jobData.company,
          jobTitle: jobData.title,
          location: jobData.location,
          salary: jobData.salary,
          recipient: selectedContact?.email || currentEmail
        })
      })

      if (response.ok) {
        console.log('[OUTREACH] ✅ Application created')
        // Navigate to interview prep
        router.push('/career-finder/interview-prep')
      } else {
        console.error('[OUTREACH] ❌ Failed to create application')
        // Still navigate even if creation fails
        router.push('/career-finder/interview-prep')
      }
    } catch (error) {
      console.error('[OUTREACH] Error creating application:', error)
      // Navigate anyway
      router.push('/career-finder/interview-prep')
    }
  }

  const loadDataAndGenerateEmail = async () => {
    try {
      // Load job data
      const job = CareerFinderStorage.getJob()
      if (!job) {
        setError('No job selected')
        setLoading(false)
        return
      }
      setJobData(job)

      // Load resume
      const resume = CareerFinderStorage.getResume()
      const resumeText = resume?.extractedText || ''

      // Load job analysis for match insights
      const analysis = CareerFinderStorage.getJobAnalysis()

      // AUTOPILOT: Check cache first
      const cacheKey = 'cf:emailOutreach'
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        console.log('[OUTREACH] ✅ Loading from cache')
        const outreach = JSON.parse(cached)
        setEmailSubject(outreach.subjects?.[0] || `Application for ${job.title}`)
        setEmailBody(outreach.templates?.[0]?.body || '')
        setLoading(false)
        return
      }

      console.log('[OUTREACH] 🔄 Generating email outreach via autopilot...')

      // Extract resume highlights
      const skills = analysis?.matchingSkills || []
      const resumeHighlights = skills.slice(0, 3)

      // Call new autopilot endpoint
      const response = await fetch('/api/contacts/email-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hiringContact: {
            name: 'Hiring Manager',
            title: 'Hiring Manager'
          },
          jobTitle: job.title,
          company: job.company,
          resumeHighlights
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const { subjects, templates } = result.data
        setEmailSubject(subjects?.[0] || `Application for ${job.title}`)
        setEmailBody(templates?.[0]?.body || '')
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify(result.data))
        console.log('[OUTREACH] ✅ Email outreach generated and cached')
      } else {
        throw new Error(result.error || 'Failed to generate email outreach')
      }

      setLoading(false)
    } catch (err) {
      console.error('[OUTREACH] Error:', err)
      setError('Failed to load outreach data')
      setLoading(false)
    }
  }

  const selectContact = (contact: HiringContact, job: any, analysis: any, resumeText: string) => {
    setSelectedContact(contact)
    
    // Generate personalized email
    const subject = `Application for ${job.title} - ${extractName(resumeText) || 'Experienced Professional'}`
    setEmailSubject(subject)

    const matchScore = analysis?.matchScore || 0
    const skills = analysis?.matchingSkills || []
    const name = extractName(resumeText) || ''

    const body = `Dear ${contact.name || 'Hiring Manager'},

I am writing to express my strong interest in the ${job.title} position at ${job.company}. ${contact.title ? `As ${contact.title}, I` : 'I'} believe you would be the right person to discuss how my qualifications align with your team's needs.

KEY QUALIFICATIONS:
${skills.slice(0, 5).map((skill: string) => `• ${skill}`).join('\n')}

${matchScore >= 80 ? `My background shows a ${matchScore}% alignment with your requirements, particularly in ${skills[0] || 'the core competencies'} needed for this role.` : ''}

I have attached my resume and cover letter for your review. I would welcome the opportunity to discuss how I can contribute to ${job.company}'s success.

Thank you for your consideration. I look forward to speaking with you.

Best regards,
${name}

---
Resume and cover letter attached
${contact.linkedinUrl ? `LinkedIn: Let's connect at ${contact.linkedinUrl}` : ''}`

    setEmailBody(body)
  }

  const generateEmailForOfficial = (email: string, job: any, analysis: any, resumeText: string) => {
    const subject = `Application for ${job.title} Position`
    setEmailSubject(subject)

    const matchScore = analysis?.matchScore || 0
    const skills = analysis?.matchingSkills || []
    const name = extractName(resumeText) || ''

    const body = `Dear Hiring Team,

I am writing to apply for the ${job.title} position at ${job.company}.

KEY QUALIFICATIONS:
${skills.slice(0, 5).map((skill: string) => `• ${skill}`).join('\n')}

${matchScore >= 80 ? `My professional background demonstrates a strong ${matchScore}% alignment with the role requirements.` : ''}

Please find my resume and cover letter attached for your consideration.

Thank you for your time and consideration.

Best regards,
${name}`

    setEmailBody(body)
  }

  const extractName = (resumeText: string): string => {
    const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines.slice(0, 5)) {
      if (line.length > 5 && line.length < 50 && !line.includes('@') && !line.match(/\d{3}/) && /^[A-Z]/.test(line)) {
        return line
      }
    }
    return ''
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const sendEmail = () => {
    const email = selectedContact?.email || companyData?.hiringContactIntelligence?.officialChannels?.jobsEmail
    if (!email) return

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.location.href = mailtoLink
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-bold mt-4">Preparing Your Outreach...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <CareerFinderBackButton />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const contacts = companyData?.hiringContactIntelligence?.keyContacts || []
  const officialChannels = companyData?.hiringContactIntelligence?.officialChannels
  const currentEmail = selectedContact?.email || officialChannels?.jobsEmail || officialChannels?.hrEmail

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <CareerFinderBackButton />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Ready to Reach Out</h1>
        <p className="text-gray-600">
          Your personalized outreach materials for {jobData?.title} at {jobData?.company}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contacts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Hiring Contacts */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Hiring Contacts
              </h3>
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    onClick={() => selectContact(contact, jobData, CareerFinderStorage.getJobAnalysis(), CareerFinderStorage.getResume()?.extractedText || '')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedContact === contact
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.title}</p>
                    {contact.department && (
                      <p className="text-xs text-gray-500 mt-1">{contact.department}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contact.email && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          <Mail className="w-3 h-3" /> Email
                        </span>
                      )}
                      {contact.linkedinUrl && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </span>
                      )}
                      {contact.phone && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          <Phone className="w-3 h-3" /> Phone
                        </span>
                      )}
                    </div>
                    {contact.authority && (
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        {contact.authority}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Channels */}
          {officialChannels && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Official Channels
              </h3>
              <div className="space-y-3 text-sm">
                {officialChannels.careersPage && (
                  <div>
                    <p className="text-gray-600 mb-1">Careers Page</p>
                    <a 
                      href={officialChannels.careersPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Apply Online <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {officialChannels.jobsEmail && (
                  <div>
                    <p className="text-gray-600 mb-1">Jobs Email</p>
                    <p className="font-medium">{officialChannels.jobsEmail}</p>
                  </div>
                )}
                {officialChannels.phone && (
                  <div>
                    <p className="text-gray-600 mb-1">Phone</p>
                    <a href={`tel:${officialChannels.phone}`} className="font-medium text-blue-600 hover:underline">
                      {officialChannels.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategy Recommendations */}
          {companyData?.strategicRecommendations?.contactStrategy && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold mb-3 text-blue-900">💡 Contact Strategy</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {companyData.strategicRecommendations.contactStrategy}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Email Draft */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Preview */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold mb-4">Your Outreach Email</h3>

            {/* To Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={currentEmail || 'No email found'}
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
                {currentEmail && (
                  <Button
                    onClick={() => copyToClipboard(currentEmail, 'email')}
                    variant="outline"
                    size="sm"
                  >
                    {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>

            {/* Subject Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
                <Button
                  onClick={() => copyToClipboard(emailSubject, 'subject')}
                  variant="outline"
                  size="sm"
                >
                  {copiedField === 'subject' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Body Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
              <div className="relative">
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white"
                />
                <Button
                  onClick={() => copyToClipboard(emailBody, 'body')}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  {copiedField === 'body' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={sendEmail}
                disabled={!currentEmail}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Open in Email Client
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Note: This will open your default email client with the message pre-filled. Resume and cover letter will be automatically attached.
            </p>
          </div>

          {/* Additional Contact Options */}
          {selectedContact && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4">Additional Contact Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedContact.linkedinUrl && (
                  <a
                    href={selectedContact.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <Linkedin className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Connect on LinkedIn</p>
                      <p className="text-sm text-gray-600">Send a connection request</p>
                    </div>
                  </a>
                )}
                {selectedContact.phone && (
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    <Phone className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Call {selectedContact.name}</p>
                      <p className="text-sm text-gray-600">{selectedContact.phone}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <Button
          onClick={() => router.push('/career-finder/cover-letter')}
          variant="outline"
        >
          ← Back to Cover Letter
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/career-finder/search')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Apply to More Jobs →
          </Button>
          <Button
            onClick={handleCompleteApplication}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Application → Interview Prep
          </Button>
        </div>
      </div>
    </div>
  )
}

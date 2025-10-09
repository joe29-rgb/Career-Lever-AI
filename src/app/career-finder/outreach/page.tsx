"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'
import { Loader2, CheckCircle, Mail, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface EnhancedContact {
  name: string
  title: string
  email?: string
  linkedinUrl?: string
  verified_email: boolean
  email_confidence: number
  decision_maker_score: number
  personality_insights: {
    communication_style: string
    response_likelihood: number
  }
}

interface PersonalizedEmail {
  subject: string
  body: string
  cta: string
  personalization_score: number
  variant_id?: string
  tone: string
}

export default function CareerFinderOutreachPage() {
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [personalizing, setPersonalizing] = useState(false)
  
  const [job, setJob] = useState<any>(null)
  const [contacts, setContacts] = useState<EnhancedContact[]>([])
  const [personalizedEmails, setPersonalizedEmails] = useState<PersonalizedEmail[]>([])
  const [selectedContact, setSelectedContact] = useState<EnhancedContact | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<PersonalizedEmail | null>(null)
  
  useEffect(() => {
    initializeOutreach()
  }, [])
  
  const initializeOutreach = async () => {
    try {
      localStorage.setItem('cf:progress', JSON.stringify({ step: 7, total: 7 }))
      
      // Load selected job
      const jobData = localStorage.getItem('cf:selectedJob')
      if (!jobData) {
        toast.error('No job selected. Please go back and select a job.')
        setLoading(false)
        return
      }
      
      const selectedJob = JSON.parse(jobData)
      setJob(selectedJob)
      
      console.log('[OUTREACH] Loaded job:', selectedJob.company)
      
      // Load company research with contacts
      await loadAndEnrichContacts(selectedJob)
      
    } catch (error) {
      console.error('[OUTREACH] Initialization error:', error)
      toast.error('Failed to load outreach data')
    } finally {
      setLoading(false)
    }
  }
  
  const loadAndEnrichContacts = async (selectedJob: any) => {
    setEnriching(true)
    
    try {
      // Fetch company research with hiring contacts
      const response = await fetch('/api/v2/company/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: selectedJob.company,
          targetRole: selectedJob.title
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to load company research')
      }
      
      const data = await response.json()
      const hiringContacts = data.contacts?.data || []
      
      console.log('[OUTREACH] Found', hiringContacts.length, 'contacts')
      
      if (hiringContacts.length === 0) {
        toast.error('No hiring contacts found. Try searching LinkedIn manually.')
        return
      }
      
      // PHASE 2A: Enrich contacts with verification and personality
      const companyDomain = selectedJob.url ? 
        new URL(selectedJob.url).hostname.replace('www.', '') : 
        `${selectedJob.company.toLowerCase().replace(/\s+/g, '')}.com`
      
      const enrichedContacts = hiringContacts.map((contact: any) => ({
        ...contact,
        verified_email: contact.confidence > 70,
        email_confidence: contact.confidence || 60,
        decision_maker_score: calculateDecisionScore(contact.title),
        personality_insights: {
          communication_style: inferStyle(contact.title),
          response_likelihood: contact.confidence || 50
        }
      }))
      
      // Sort by decision maker score
      enrichedContacts.sort((a: any, b: any) => b.decision_maker_score - a.decision_maker_score)
      
      setContacts(enrichedContacts)
      
      // Auto-select first contact
      if (enrichedContacts.length > 0) {
        setSelectedContact(enrichedContacts[0])
        await generatePersonalizedEmails(enrichedContacts[0], selectedJob)
      }
      
      toast.success(`Found ${enrichedContacts.length} hiring contacts!`)
      
    } catch (error) {
      console.error('[OUTREACH] Contact loading error:', error)
      toast.error('Failed to load contacts')
    } finally {
      setEnriching(false)
    }
  }
  
  const generatePersonalizedEmails = async (contact: EnhancedContact, selectedJob: any) => {
    setPersonalizing(true)
    
    try {
      // Load resume for personalization
      const resumeData = localStorage.getItem('cf:resume')
      if (!resumeData) {
        toast.error('Resume not found. Using generic template.')
        return
      }
      
      const resume = JSON.parse(resumeData)
      const resumeText = resume.extractedText || ''
      
      console.log('[OUTREACH] Generating personalized emails...')
      
      // PHASE 2B: Generate 3 AI-powered variants
      // For now, generate basic personalized versions (full AI integration in next step)
      const variants: PersonalizedEmail[] = [
        {
          subject: `${selectedJob.title} - ${contact.name}`,
          body: `Hi ${contact.name.split(' ')[0]},\n\nI noticed ${selectedJob.company}'s opening for ${selectedJob.title}. With my background in [your key skill], I believe I could add immediate value to your team.\n\nWould you be open to a brief conversation about the role?\n\nBest regards`,
          cta: 'Brief conversation',
          personalization_score: 65,
          variant_id: 'A',
          tone: 'professional'
        },
        {
          subject: `Quick question about ${selectedJob.title} at ${selectedJob.company}`,
          body: `Hi ${contact.name.split(' ')[0]},\n\nI came across the ${selectedJob.title} position and I'm excited about the opportunity. My experience with [your expertise] aligns well with ${selectedJob.company}'s goals.\n\nCould we schedule a 15-minute call to discuss?\n\nThank you`,
          cta: '15-minute call',
          personalization_score: 70,
          variant_id: 'B',
          tone: 'direct'
        },
        {
          subject: `${selectedJob.company} ${selectedJob.title} - Value I Can Add`,
          body: `Hello ${contact.name.split(' ')[0]},\n\nI'm reaching out about the ${selectedJob.title} role. Based on my research of ${selectedJob.company}, I see an opportunity where my skills in [your strength] could contribute to your team's success.\n\nI'd welcome the chance to discuss this further.\n\nBest`,
          cta: 'Further discussion',
          personalization_score: 75,
          variant_id: 'C',
          tone: 'value-focused'
        }
      ]
      
      setPersonalizedEmails(variants)
      setSelectedEmail(variants[0])
      
      toast.success('Generated 3 personalized email variants!')
      
    } catch (error) {
      console.error('[OUTREACH] Personalization error:', error)
      toast.error('Failed to generate personalized emails')
    } finally {
      setPersonalizing(false)
    }
  }
  
  const handleContactSelect = async (contact: EnhancedContact) => {
    setSelectedContact(contact)
    if (job) {
      await generatePersonalizedEmails(contact, job)
    }
  }
  
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard!`)
  }
  
  const handleSendEmail = (contact: EnhancedContact, email: PersonalizedEmail) => {
    if (!contact.email) {
      toast.error('No email address available for this contact')
      return
    }
    
    const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
    window.open(mailto, '_blank')
    
    toast.success('Email composer opened!')
    
    // Mark as sent
    markAsSent()
  }
  
  const markAsSent = async () => {
    try {
      if (!job) return
      
      await fetch('/api/applications/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          companyName: job.company,
          jobDescription: job.description || '',
          jobUrl: job.url
        })
      })
      
      // Create inbox labels
      await fetch('/api/inbox/label/create', { method: 'POST' }).catch(() => {})
      await fetch('/api/inbox/outlook/category/create', { method: 'POST' }).catch(() => {})
      
      toast.success('Application tracked!')
    } catch (error) {
      console.error('[OUTREACH] Mark sent error:', error)
    }
  }
  
  // Helper functions
  const calculateDecisionScore = (title: string): number => {
    const titleLower = title.toLowerCase()
    if (/ceo|cto|cfo|vp|chief|president/.test(titleLower)) return 95
    if (/director/.test(titleLower)) return 85
    if (/recruiter|talent|hr manager|hiring/.test(titleLower)) return 90
    if (/manager|lead|head/.test(titleLower)) return 70
    return 50
  }
  
  const inferStyle = (title: string): string => {
    const titleLower = title.toLowerCase()
    if (/ceo|cto|cfo|vp|chief/.test(titleLower)) return 'direct'
    if (/recruiter|talent|hr/.test(titleLower)) return 'formal'
    return 'professional'
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground">Loading outreach data...</p>
        </div>
      </div>
    )
  }
  
  if (!job) {
    return (
      <div className="min-h-screen bg-background p-8">
        <CareerFinderBackButton />
        <Card className="p-6 mt-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">No Job Selected</h2>
          <p className="text-center text-muted-foreground">
            Please go back and select a job to start outreach.
          </p>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero p-8 rounded-b-3xl shadow-2xl mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <CareerFinderBackButton />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-center mb-3">
            ✉️ AI-Powered Outreach
          </h1>
          <p className="text-foreground/90 text-center text-lg">
            {job.title} at {job.company}
          </p>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Loading States */}
        {(enriching || personalizing) && (
          <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-foreground">
                {enriching && 'Enriching contacts with AI...'}
                {personalizing && 'Generating personalized emails...'}
              </span>
            </div>
          </Card>
        )}
        
        {/* Contacts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 lg:col-span-1">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Hiring Contacts ({contacts.length})
            </h3>
            
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No contacts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    onClick={() => handleContactSelect(contact)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedContact?.email === contact.email
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{contact.name}</h4>
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      </div>
                      <Badge variant={contact.verified_email ? 'default' : 'secondary'}>
                        {contact.email_confidence}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>Decision Power: {contact.decision_maker_score}/100</span>
                    </div>
                    
                    {contact.email && (
                      <div className="text-xs text-foreground truncate">{contact.email}</div>
                    )}
                    
                    {contact.linkedinUrl && (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
          
          {/* Personalized Emails Section */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">
              AI-Personalized Email Variants
            </h3>
            
            {!selectedContact ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select a contact to generate personalized emails</p>
              </div>
            ) : personalizedEmails.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Generating personalized emails...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {personalizedEmails.map((email, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      selectedEmail?.variant_id === email.variant_id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Variant {email.variant_id}</Badge>
                        <Badge variant="secondary">{email.tone}</Badge>
                        <Badge 
                          variant={email.personalization_score > 70 ? 'default' : 'secondary'}
                        >
                          {email.personalization_score}% personalized
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEmail(email)}
                      >
                        Select
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Subject:</label>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-foreground flex-1">{email.subject}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(email.subject, 'Subject')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Body:</label>
                        <div className="mt-1">
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans bg-muted p-3 rounded">
                            {email.body}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(email.body, 'Body')}
                            className="mt-2"
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copy Body
                          </Button>
                        </div>
                      </div>
                      
                      {selectedEmail?.variant_id === email.variant_id && selectedContact?.email && (
                        <Button
                          onClick={() => handleSendEmail(selectedContact, email)}
                          className="w-full"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Open in Email Client
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        
        {/* Success Message */}
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200">
              <strong>Career Finder Complete!</strong> Your personalized outreach is ready.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { CompanyData, CompanyResearchPanelProps } from '@/types'
import {
  Building,
  Search,
  Star,
  Users,
  TrendingUp,
  Globe,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Twitter,
  Brain,
  Target
} from 'lucide-react'

type CompanyResearchProps = {
  initialCompanyName?: string
  onResearchComplete?: (data: CompanyData) => void
  onError?: (error: string) => void
  titleOverride?: string
  descriptionOverride?: string
  autoRun?: boolean
  hideInputs?: boolean
  hideActions?: boolean
  defaultSubject?: string
  defaultBody?: string
}

export default function CompanyResearch({ initialCompanyName, onResearchComplete, onError, titleOverride, descriptionOverride, autoRun, hideInputs, hideActions, defaultSubject, defaultBody }: CompanyResearchProps = {}) {
  const [companyName, setCompanyName] = useState(initialCompanyName || (typeof window !== 'undefined' ? localStorage.getItem('job:company') || '' : ''))
  const [website, setWebsite] = useState<string>(()=>{ try { return localStorage.getItem('job:website') || '' } catch { return '' } })
  const [jobTitle, setJobTitle] = useState<string>(()=>{ try { return localStorage.getItem('job:title') || '' } catch { return '' } })
  const [location, setLocation] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [researchProgress, setResearchProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [researchResult, setResearchResult] = useState<any | null>(null)
  const [profileIndex, setProfileIndex] = useState<number | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [psychology, setPsychology] = useState<any | null>(null)
  const [loadingPsych, setLoadingPsych] = useState(false)
  const [marketIntel, setMarketIntel] = useState<string>('')
  const [loadingIntel, setLoadingIntel] = useState(false)
  // Intro email composer state
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeTo, setComposeTo] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Auto-run research on mount if requested
  useEffect(() => {
    if (autoRun && !researchResult && !isResearching) {
      // FIX RACE CONDITION: Use local variables instead of state
      const c = initialCompanyName || (typeof window !== 'undefined' ? localStorage.getItem('job:company') || '' : '')
      const w = typeof window !== 'undefined' ? localStorage.getItem('job:website') || '' : ''
      const t = typeof window !== 'undefined' ? localStorage.getItem('job:title') || '' : ''
      const l = typeof window !== 'undefined' ? localStorage.getItem('job:location') || '' : ''
      
      console.log('[COMPANY_RESEARCH] Auto-run with:', { company: c, website: w, title: t, location: l })
      
      // Update state (for display)
      if (c) setCompanyName(c)
      if (w) setWebsite(w)
      if (t) setJobTitle(t)
      if (l) setLocation(l)
      
      // Call research with local variables (not state)
      if (c && c.trim()) {
        handleResearchWithData(c, w, t, l)
      } else {
        console.warn('[COMPANY_RESEARCH] No company name found for auto-run')
        setError('No company name provided')
      }
    }
  }, [autoRun, initialCompanyName])

  // New method: Research with explicit data (avoids state race condition)
  const handleResearchWithData = async (company: string, web?: string, title?: string, loc?: string) => {
    if (!company || !company.trim()) {
      setError('Please enter a company name')
      onError?.('Please enter a company name')
      return
    }
    
    setIsResearching(true)
    setResearchProgress(0)
    setError(null)

    try {
      const progressInterval = setInterval(() => {
        setResearchProgress((p) => (p >= 90 ? 90 : p + 15))
      }, 500)

      const response = await fetch('/api/v2/company/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.trim(),
          website: web?.trim() || undefined,
          jobTitle: title?.trim() || undefined,
          location: loc?.trim() || undefined,
        })
      })

      clearInterval(progressInterval)
      setResearchProgress(100)

      if (!response.ok) {
        const data = await response.json().catch(()=>({}))
        throw new Error((data as any).error || 'Research failed')
      }

      const data = await response.json()
      const result: CompanyData = (data.companyData || data.research)
      // Attach contacts if provided by API
      if (Array.isArray((data as any).contacts)) {
        ;(result as any).hiringContacts = (data as any).contacts
      }
      setResearchResult(result)
      onResearchComplete?.(result)
      // Save to localStorage
      try {
        if (company) localStorage.setItem('job:company', company)
        if (web) localStorage.setItem('job:website', web)
        if (title) localStorage.setItem('job:title', title)
      } catch {}
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Research failed'
      setError(msg)
      onError?.(msg)
    } finally {
      setIsResearching(false)
      setTimeout(() => setResearchProgress(0), 800)
    }
  }

  const handleResearch = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name')
      onError?.('Please enter a company name')
      return
    }
    // Use the new method with state variables
    return handleResearchWithData(companyName, website, jobTitle, location)
  }

  const refreshResearch = async () => {
    if (!companyName.trim()) return
    setIsResearching(true)
    setError(null)
    setResearchProgress(0)
    try {
      const response = await fetch('/api/v2/company/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), website: website.trim() || undefined, jobTitle: jobTitle.trim() || undefined, location: location.trim() || undefined })
      })
      if (!response.ok) {
        const data = await response.json().catch(()=>({}))
        throw new Error((data as any).error || 'Refresh failed')
      }
      const data = await response.json()
      const result: CompanyData = (data.companyData || data.research)
      if (Array.isArray((data as any).contacts)) {
        ;(result as any).hiringContacts = (data as any).contacts
      }
      setResearchResult(result)
      onResearchComplete?.(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Refresh failed'
      setError(msg)
      onError?.(msg)
    } finally {
      setIsResearching(false)
    }
  }

  const showProfileForContact = async (index: number, person: any) => {
    setProfileIndex(index)
    setProfileLoading(true)
    setProfileData(null)
    try {
      const res = await fetch('/api/insights/hiring/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: person.name, companyName: companyName.trim(), roleType: jobTitle.trim() || undefined, linkedinUrl: person.profileUrl || undefined })
      })
      if (!res.ok) throw new Error('Profile fetch failed')
      const json = await res.json()
      setProfileData(json.profile)
    } catch (e) {
      setProfileData({ error: 'Failed to load profile' })
    } finally {
      setProfileLoading(false)
    }
  }

  const runPsychology = async () => {
    setLoadingPsych(true)
    try {
      let jd = ''
      try { jd = localStorage.getItem('job:description') || '' } catch {}
      if (!jd || jd.length < 20) throw new Error('Add a job description first (Analyze step)')
      const res = await fetch('/api/insights/psychology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription: jd, companySignals: researchResult || {} }) })
      const json = await res.json().catch(()=>({}))
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to compute psychology')
      setPsychology(json.psychology)
      try { localStorage.setItem('analyze:psychology', JSON.stringify(json.psychology)) } catch {}
    } catch (e: any) {
      setError(e?.message || 'Psychology failed')
    } finally { setLoadingPsych(false) }
  }

  const runMarketIntel = async () => {
    setLoadingIntel(true)
    try {
      const res = await fetch('/api/v2/company/intel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: companyName.trim(), role: jobTitle.trim() || undefined, geo: location.trim() || undefined }) })
      const json = await res.json().catch(()=>({}))
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch market intelligence')
      setMarketIntel(json.intel?.summary || '')
    } catch (e: any) {
      setError(e?.message || 'Market intelligence failed')
    } finally { setLoadingIntel(false) }
  }

  // Intro email helpers
  const openComposer = (person: any) => {
    const subj = (defaultSubject && defaultSubject.trim()) ? defaultSubject : `Introduction regarding ${jobTitle || 'an opportunity'} – ${companyName}`
    const greeting = `Hello ${person?.name?.split(' ')[0] || 'there'},`
    const fallbackBody = `${greeting}\n\n` +
      `I’m reaching out regarding ${jobTitle || 'an opportunity'} at ${companyName}. ` +
      `I believe my background aligns well and I’d welcome the chance to connect.\n\n` +
      `Please see attached resume and a brief cover letter summarizing my fit. ` +
      `Happy to share more details or schedule a short call at your convenience.\n\n` +
      `Best regards,\n` +
      (typeof window !== 'undefined' ? (localStorage.getItem('user:name') || 'Candidate') : 'Candidate')
    const body = (defaultBody && defaultBody.trim()) ? defaultBody : fallbackBody
    setComposeSubject(subj)
    setComposeBody(body)
    setComposeTo(typeof person?.email === 'string' ? person.email : '')
    setComposeOpen(true)
  }

  const mailtoHref = () => {
    const to = composeTo || ''
    const s = encodeURIComponent(composeSubject || '')
    const b = encodeURIComponent(composeBody || '')
    return `mailto:${to}?subject=${s}&body=${b}`
  }

  const downloadPdfFromHtml = async (html: string, filename: string) => {
    const wrapped = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>${filename}</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${html.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
    setDownloading(true)
    try {
      const resp = await fetch('/api/resume/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: wrapped, filename: `${filename}.pdf` }) })
      if (!resp.ok) throw new Error('Failed')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
    finally { setDownloading(false) }
  }

  const downloadLatestResume = async () => {
    try {
      // Prefer selected optimized HTML from optimizer step
      let html = ''
      try { html = localStorage.getItem('cf:selectedResumeHtml') || '' } catch {}
      if (!html) {
        const rl = await fetch('/api/resume/list')
        if (!rl.ok) return
        const rj = await rl.json()
        const txt: string = rj?.resumes?.[0]?.extractedText || ''
        if (!txt) return
        html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resume</title><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#333;max-width:8.5in;margin:0 auto;padding:0.5in;white-space:pre-wrap}</style></head><body>${txt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`
      }
      const name = `${companyName || 'Company'}_${jobTitle || 'Role'}_Resume`
      await downloadPdfFromHtml(html, name)
    } catch {}
  }

  const downloadLatestCoverLetter = async () => {
    try {
      // Prefer selected cover letter from wizard
      let content = ''
      try { content = localStorage.getItem('cf:selectedCoverLetter') || '' } catch {}
      if (!content) {
        const cl = await fetch('/api/cover-letter/list')
        if (!cl.ok) return
        const cj = await cl.json()
        const latest = Array.isArray(cj.letters) && cj.letters.length ? cj.letters[0] : null
        content = latest?.content || ''
      }
      if (!content) return
      const name = `${companyName || 'Company'}_${jobTitle || 'Role'}_CoverLetter`
      await downloadPdfFromHtml(content, name)
    } catch {}
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          {titleOverride || 'Company Research'}
        </CardTitle>
          <CardDescription>
          {descriptionOverride || 'Get comprehensive insights about companies from multiple sources. Use responsibly and verify before contacting.'}
          </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {!hideInputs && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input id="companyName" placeholder="e.g., Google" value={companyName} onChange={(e)=>setCompanyName(e.target.value)} disabled={isResearching} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Input id="website" placeholder="https://company.com" value={website} onChange={(e)=>setWebsite(e.target.value)} disabled={isResearching} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Target Role (Optional)</Label>
            <Input id="jobTitle" placeholder="e.g., Senior AE" value={jobTitle} onChange={(e)=>setJobTitle(e.target.value)} disabled={isResearching} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input id="location" placeholder="e.g., Edmonton, AB" value={location} onChange={(e)=>setLocation(e.target.value)} disabled={isResearching} />
          </div>
        </div>
        )}

        {/* Progress */}
        {isResearching && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Researching company...</span>
              <span className="text-sm text-gray-600">{researchProgress}%</span>
            </div>
            <Progress value={researchProgress} className="w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-32 md:col-span-2" />
            </div>
          </div>
        )}

        {/* Actions */}
        {!hideActions && (
        <div className="flex gap-3">
          <Button onClick={handleResearch} disabled={isResearching || !companyName.trim()} className="flex-1">
            {isResearching ? (<><Search className="mr-2 h-4 w-4" /> Researching...</>) : (<><Search className="mr-2 h-4 w-4" /> Research Company</>) }
          </Button>
          {researchResult && (
            <Button variant="outline" onClick={refreshResearch} disabled={isResearching}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          )}
        </div>
        )}

        {/* Results */}
        {researchResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Research completed successfully!</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Company */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Company</p>
                      <p className="text-lg font-semibold line-clamp-2">{researchResult.companyName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Glassdoor Rating */}
              {researchResult.glassdoorRating && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Star className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Glassdoor Rating</p>
                        <p className="text-lg font-semibold">{researchResult.glassdoorRating}/5</p>
                        {researchResult.glassdoorReviews && (
                          <p className="text-xs text-gray-600">{researchResult.glassdoorReviews} reviews</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Size */}
              {researchResult.size && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Company Size</p>
                        <p className="text-lg font-semibold">{researchResult.size}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Industry */}
              {researchResult.industry && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Industry</p>
                        <p className="text-lg font-semibold">{researchResult.industry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Description */}
            {researchResult.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{researchResult.description}</p>
                </CardContent>
              </Card>
            )}

            {/* LinkedIn */}
            {researchResult.linkedinData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    LinkedIn Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {researchResult.linkedinData.followers && (
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Followers</span><span className="font-medium">{researchResult.linkedinData.followers.toLocaleString()}</span></div>
                  )}
                  {researchResult.linkedinData.employeeCount && (
                    <div className="flex justify-between"><span className="text-sm text-gray-600">Employees</span><span className="font-medium">{researchResult.linkedinData.employeeCount.toLocaleString()}</span></div>
                  )}
                  {researchResult.linkedinData.companyPage && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={researchResult.linkedinData.companyPage} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> View on LinkedIn
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contacts */}
            {Array.isArray(researchResult.hiringContacts) && researchResult.hiringContacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hiring Contacts</CardTitle>
                  <CardDescription>Publicly discoverable recruiter/manager leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {researchResult.hiringContacts.map((p: any, idx: number) => (
                      <div key={idx} className="border rounded p-3 space-y-2 bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.title}</div>
                            {(p.email || (p.alternativeEmails && p.alternativeEmails.length)) && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {p.email ? (<div className="text-foreground">{p.emailType === 'inferred' ? '(inferred) ' : ''}{p.email}</div>) : null}
                                {Array.isArray(p.alternativeEmails) && p.alternativeEmails.slice(0,2).map((em:string,i:number)=>(<div key={i} className="opacity-80">{em}</div>))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {p.profileUrl && (
                              <Button asChild size="sm" variant="outline">
                                <a href={p.profileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" /> Profile</a>
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openComposer(p)}>Compose</Button>
                            <Button size="sm" variant="secondary" onClick={() => showProfileForContact(idx, p)} disabled={profileLoading && profileIndex === idx}>
                              {profileLoading && profileIndex === idx ? 'Loading…' : 'Insights'}
                            </Button>
                          </div>
                        </div>
                        {profileIndex === idx && (
                          <div className="text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded p-3 no-text-bleed">
                            {profileLoading && <div>Loading insights…</div>}
                            {!profileLoading && profileData && (
                              profileData.error ? <div className="text-red-600">{profileData.error}</div> : (
                                <div className="space-y-1">
                                  <div><span className="font-semibold">Personality:</span> {profileData.personalityType}</div>
                                  <div><span className="font-semibold">Style:</span> {profileData.communicationStyle}</div>
                                  <div><span className="font-semibold">Red flags:</span> {(profileData.redFlags || []).join(', ')}</div>
                                  <div><span className="font-semibold">Approach:</span> {profileData.optimizedApproach}</div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employer Psychology */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Employer Psychology
                </CardTitle>
                <CardDescription>Tone, formality, values, and best send windows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={runPsychology} disabled={loadingPsych}>
                    {loadingPsych ? 'Analyzing…' : 'Compute Psychology'}
                  </Button>
                  {psychology && <Badge variant="secondary">Saved for tailoring</Badge>}
                </div>
                {psychology && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="font-medium mb-1">Tone</div>
                      <div className="text-gray-700">{psychology.tone} ({psychology.formality}/100)</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Values</div>
                      <div className="text-gray-700">{(psychology.values || []).join(', ')}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Best Send Windows</div>
                      <div className="text-gray-700">{(psychology.bestSendWindows || []).join(' • ')}</div>
                    </div>
                    {Array.isArray(psychology.languageGuidance) && psychology.languageGuidance.length > 0 && (
                      <div className="md:col-span-3">
                        <div className="font-medium mb-1">Language Guidance</div>
                        <ul className="list-disc ml-5 space-y-1">
                          {psychology.languageGuidance.map((g: string, i: number)=>(<li key={i}>{g}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4" /> Market Intelligence
                </CardTitle>
                <CardDescription>Hiring momentum, positioning, culture signals, and angles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={runMarketIntel} variant="outline" disabled={loadingIntel}>
                  {loadingIntel ? 'Loading…' : 'Fetch Market Intel'}
                </Button>
                {marketIntel && (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {marketIntel}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info from Website */}
            {researchResult.contactInfo && (Array.isArray(researchResult.contactInfo.emails) || Array.isArray(researchResult.contactInfo.phones) || Array.isArray(researchResult.contactInfo.addresses)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                  <CardDescription>Discovered from website pages</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {Array.isArray(researchResult.contactInfo.emails) && researchResult.contactInfo.emails.length > 0 && (
                    <div>
                      <div className="font-medium mb-1">Emails</div>
                      <ul className="space-y-1">
                        {researchResult.contactInfo.emails.slice(0,8).map((e:string,i:number)=> (
                          <li key={i} className="break-all">{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(researchResult.contactInfo.phones) && researchResult.contactInfo.phones.length > 0 && (
                    <div>
                      <div className="font-medium mb-1">Phones</div>
                      <ul className="space-y-1">
                        {researchResult.contactInfo.phones.slice(0,8).map((p:string,i:number)=> (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(researchResult.contactInfo.addresses) && researchResult.contactInfo.addresses.length > 0 && (
                    <div className="md:col-span-1">
                      <div className="font-medium mb-1">Addresses</div>
                      <ul className="space-y-1">
                        {researchResult.contactInfo.addresses.slice(0,6).map((a:string,i:number)=> (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Google OSINT Bundles */}
            {researchResult.osint && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Public Web Signals</CardTitle>
                  <CardDescription>Financials, culture, leadership, growth, benefits, news</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {['financial','culture','leadership','growth','benefits','news'].map((k) => (
                    Array.isArray(researchResult.osint[k]) && researchResult.osint[k].length > 0 ? (
                      <div key={k}>
                        <div className="font-medium mb-1 capitalize">{k}</div>
                        <ul className="space-y-1">
                          {researchResult.osint[k].slice(0,5).map((it:any,i:number)=> (
                            <li key={i} className="flex items-center justify-between gap-2">
                              <div className="line-clamp-1">{it.title || it.snippet}</div>
                              {it.url && <Button asChild size="sm" variant="outline"><a href={it.url} target="_blank" rel="noopener noreferrer">Open</a></Button>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Twitter/X Mentions */}
            {researchResult.osint?.twitter && Array.isArray(researchResult.osint.twitter) && researchResult.osint.twitter.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-sky-500" />
                    Twitter/X Mentions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {researchResult.osint.twitter.slice(0,6).map((t:any,i:number)=> (
                    <div key={i} className="flex items-center justify-between border rounded p-3">
                      <div className="pr-3 text-sm line-clamp-1">{t.title || t.snippet}</div>
                      {t.url && (
                        <Button asChild size="sm" variant="outline"><a href={t.url} target="_blank" rel="noopener noreferrer">Open</a></Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sources</CardTitle>
                <CardDescription>Primary links and timestamps</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {researchResult.website && (
                  <div className="flex items-center justify-between border rounded p-3">
                    <span className="font-medium">Website</span>
                    <Button asChild size="sm" variant="outline"><a href={researchResult.website} target="_blank" rel="noopener noreferrer">Open</a></Button>
                  </div>
                )}
                {researchResult.linkedinData?.companyPage && (
                  <div className="flex items-center justify-between border rounded p-3">
                    <span className="font-medium">LinkedIn</span>
                    <Button asChild size="sm" variant="outline"><a href={researchResult.linkedinData.companyPage} target="_blank" rel="noopener noreferrer">Open</a></Button>
                  </div>
                )}
                {Array.isArray(researchResult.recentNews) && researchResult.recentNews.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="font-medium mb-2">Recent News</div>
                    <div className="space-y-2">
                      {researchResult.recentNews.slice(0,5).map((n: any, i: number)=> (
                        <div key={i} className="flex items-center justify-between border rounded p-3">
                          <div className="pr-3">
                            <div className="text-sm font-medium line-clamp-1">{n.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2"><Calendar className="h-3 w-3" /> {new Date(n.publishedAt).toLocaleString()}</div>
                          </div>
                          {n.url && (
                            <Button asChild size="sm" variant="outline"><a href={n.url} target="_blank" rel="noopener noreferrer">Open</a></Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {researchResult.cachedAt && (
                  <div className="text-xs text-gray-500 md:col-span-2">Cached: {new Date(researchResult.cachedAt).toLocaleString()}</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!isResearching && !researchResult && !error && (
          <div className="text-sm text-gray-600 border rounded-lg p-4">
            Enter a company name and click Research to get reviews, social signals, contacts, and sources.
          </div>
        )}
      {/* Intro Email Composer Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-2xl p-4 space-y-3">
            <div className="text-sm font-medium">Compose Introduction Email</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-600">To</div>
                <input className="border rounded p-2 w-full" value={composeTo} onChange={(e)=>setComposeTo(e.target.value)} placeholder="email@company.com" />
              </div>
              <div>
                <div className="text-xs text-gray-600">Subject</div>
                <input className="border rounded p-2 w-full" value={composeSubject} onChange={(e)=>setComposeSubject(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600">Body</div>
                <textarea className="border rounded p-2 w-full h-40" value={composeBody} onChange={(e)=>setComposeBody(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="px-3 py-2 border rounded" href={mailtoHref()}>Open in Email</a>
              <button className="px-3 py-2 border rounded" onClick={()=>navigator.clipboard.writeText(`Subject: ${composeSubject}\n\n${composeBody}`)}>Copy</button>
              <button className="px-3 py-2 border rounded" onClick={downloadLatestResume} disabled={downloading}>Download Resume PDF</button>
              <button className="px-3 py-2 border rounded" onClick={downloadLatestCoverLetter} disabled={downloading}>Download Cover Letter PDF</button>
              <div className="flex-1" />
              <button className="px-3 py-2 border rounded" onClick={()=>setComposeOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  )
}

export function CompanyResearchPanel({ companyName, onResearchComplete, onError }: CompanyResearchPanelProps) {
  return (
    <CompanyResearch
      initialCompanyName={companyName}
      onResearchComplete={onResearchComplete}
      onError={onError}
    />
  )
}




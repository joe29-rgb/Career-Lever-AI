'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Send,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Settings,
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
  Users,
  Building,
  Briefcase,
  FileText,
  Link,
  Globe,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface JobBoard {
  id: string
  name: string
  automationLevel: 'full' | 'partial' | 'manual'
  loginRequired: boolean
  features: {
    fileUpload: boolean
    coverLetter: boolean
    autoSubmit: boolean
  }
  status: 'connected' | 'disconnected' | 'error'
  lastUsed?: Date
  successRate?: number
  totalApplications?: number
}

interface BulkSubmission {
  selectedBoards: string[]
  selectedApplications: string[]
  status: 'idle' | 'running' | 'completed' | 'failed'
  progress: number
  results?: any[]
}

interface JobBoardsDashboardProps {
  userId: string
}

export function JobBoardsDashboard({ userId }: JobBoardsDashboardProps) {
  const { data: session } = useSession()
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [bulkSubmission, setBulkSubmission] = useState<BulkSubmission>({
    selectedBoards: [],
    selectedApplications: [],
    status: 'idle',
    progress: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(true)
  const [jobsByBoard, setJobsByBoard] = useState<Record<string, Array<{ title?: string; url?: string; company?: string; location?: string }>>>({})
  const [jobsLoading, setJobsLoading] = useState<Record<string, boolean>>({})
  const [jobsOpen, setJobsOpen] = useState<Record<string, boolean>>({})
  const [autoPilotSettings, setAutoPilotSettings] = useState({
    dailyLimit: 10,
    jobBoards: [],
    keywords: '',
    locations: '',
    salaryRange: { min: 0, max: 0 },
    timeoutMs: 120000
  })
  const [autoPilotResults, setAutoPilotResults] = useState<Array<{ title?: string; url: string; company?: string; location?: string; source?: string }>>([])
  const [autoPilotRunning, setAutoPilotRunning] = useState(false)
  const [progress, setProgress] = useState<{ percent: number; stage: string }>({ percent: 0, stage: 'Idle' })
  const [qualityMode, setQualityMode] = useState<'speed'|'quality'>('speed')
  const [filters, setFilters] = useState<{ workType: 'any'|'remote'|'hybrid'|'onsite'; experienceLevel: 'any'|'entry'|'mid'|'senior'|'executive'; salaryMin?: number; maxResults?: number }>({ workType: 'any', experienceLevel: 'any', salaryMin: undefined, maxResults: 15 })

  // Load job boards and applications
  useEffect(() => {
    loadData()
  }, [])

  // When Auto-Pilot is enabled, try to prefill keywords/locations from resume/profile
  useEffect(() => {
    if (!autoPilotEnabled) return
    (async () => {
      try {
        // Prefill location from profile
        const prof = await fetch('/api/profile')
        if (prof.ok) {
          const pj = await prof.json()
          if (pj?.profile?.location) {
            setAutoPilotSettings(prev => ({ ...prev, locations: pj.profile.location }))
          }
        }
      } catch {}
      try {
        // Prefill keywords from resume titles (best-effort)
        const res = await fetch('/api/resume/list')
        if (res.ok) {
          const rj = await res.json()
          const txt: string = rj?.resumes?.[0]?.extractedText || ''
          if (txt && txt.length > 50) {
            const firstLines = txt.split(/\n|\r/).slice(0, 12).join(' ')
            const words = firstLines.match(/[A-Za-z][A-Za-z+\-]{2,}/g) || []
            const top = Array.from(new Set(words)).slice(0, 8).join(', ')
            if (top) setAutoPilotSettings(prev => ({ ...prev, keywords: top }))
          }
        }
      } catch {}
    })()
  }, [autoPilotEnabled])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load available job boards
      const boardsResponse = await fetch('/api/job-boards/submit')
      const boardsData = await boardsResponse.json()

      // Load user's job applications
      const appsResponse = await fetch('/api/applications')
      const appsData = await appsResponse.json()

      // Load profile to prefill autopilot
      try {
        const profRes = await fetch('/api/profile')
        if (profRes.ok) {
          const pj = await profRes.json()
          const p = pj?.profile || {}
          setAutoPilotSettings(prev => ({
            ...prev,
            keywords: (p.skills && Array.isArray(p.skills) ? p.skills.slice(0, 8).join(', ') : prev.keywords),
            locations: (typeof p.location === 'string' && p.location) ? p.location : prev.locations,
          }))
        }
      } catch {}

      if (boardsData.success) {
        // Load user's job board integrations from database
        const integrationsResponse = await fetch('/api/job-boards/integrations')
        const integrationsData = await integrationsResponse.json()

        // Enhance job board data with user-specific status
        const enhancedBoards = boardsData.jobBoards.map((board: any) => {
          const integration = integrationsData.success ?
            integrationsData.integrations.find((i: any) => i.boardName === board.id) : null

          return {
            ...board,
            status: integration ? integration.status : 'disconnected',
            lastUsed: integration ? integration.lastApplicationAt : undefined,
            successRate: integration ?
              Math.round((integration.successfulApplications / Math.max(integration.totalApplications, 1)) * 100) : 0,
            totalApplications: integration ? integration.totalApplications : 0
          }
        })
        setJobBoards(enhancedBoards)
      }

      if (appsData.applications) {
        // Map to fields this UI expects minimally
        const mapped = appsData.applications.map((app: any) => ({
          _id: app._id,
          jobTitle: app.jobTitle,
          company: app.companyName, // UI uses company
          status: app.applicationStatus, // UI uses status
          createdAt: app.createdAt,
        }))
        setApplications(mapped)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load job board data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBoardSelection = (boardId: string, checked: boolean) => {
    setSelectedBoards(prev =>
      checked
        ? [...prev, boardId]
        : prev.filter(id => id !== boardId)
    )
  }

  const handleApplicationSelection = (appId: string, checked: boolean) => {
    setSelectedApplications(prev =>
      checked
        ? [...prev, appId]
        : prev.filter(id => id !== appId)
    )
  }

  const handleBulkSubmit = async () => {
    if (selectedBoards.length === 0 || selectedApplications.length === 0) {
      toast.error('Please select both job boards and applications')
      return
    }

    setBulkSubmission({
      selectedBoards,
      selectedApplications,
      status: 'running',
      progress: 0
    })

    try {
      const totalOperations = selectedBoards.length * selectedApplications.length
      let completedOperations = 0

      const results: any[] = []

      for (const boardId of selectedBoards) {
        for (const appId of selectedApplications) {
          try {
            const response = await fetch('/api/job-boards/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jobApplicationId: appId,
                jobBoards: [boardId],
                customizations: {}
              }),
            })

            const result = await response.json()
            results.push({ boardId, appId, ...result })

            completedOperations++
            setBulkSubmission(prev => ({
              ...prev,
              progress: (completedOperations / totalOperations) * 100
            }))

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error) {
            console.error(`Failed to submit ${appId} to ${boardId}:`, error)
            results.push({
              boardId,
              appId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })

            completedOperations++
            setBulkSubmission(prev => ({
              ...prev,
              progress: (completedOperations / totalOperations) * 100
            }))
          }
        }
      }

      setBulkSubmission(prev => ({
        ...prev,
        status: 'completed',
        results
      }))

      const successful = results.filter(r => r.success).length
      toast.success(`Successfully submitted to ${successful} out of ${results.length} positions`)

      // Reset selections
      setSelectedBoards([])
      setSelectedApplications([])

    } catch (error) {
      console.error('Bulk submission error:', error)
      setBulkSubmission(prev => ({
        ...prev,
        status: 'failed'
      }))
      toast.error('Bulk submission failed')
    }
  }

  const connectToBoard = async (boardId: string) => {
    try {
      // Initiate OAuth flow
      const response = await fetch('/api/job-boards/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardName: boardId }),
      })

      const data = await response.json()

      if (data.success && data.authUrl) {
        // Redirect to OAuth authorization URL
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || 'Failed to initiate OAuth flow')
      }
    } catch (error) {
      console.error('Failed to connect to job board:', error)
      toast.error(`Failed to connect to ${jobBoards.find(b => b.id === boardId)?.name}`)
    }
  }

  const syncJobs = async (boardId: string) => {
    try {
      const resp = await fetch('/api/job-boards/jobs/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName: boardId })
      })
      const json = await resp.json()
      if (!resp.ok || !json.success) throw new Error(json.error || 'Sync failed')
      toast.success(`Imported ${json.created} new, updated ${json.updated}`)
    } catch (e) {
      toast.error('Failed to sync jobs')
    }
  }

  const loadBoardJobs = async (boardId: string) => {
    setJobsLoading(prev => ({ ...prev, [boardId]: true }))
    try {
      const resp = await fetch('/api/job-boards/jobs/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName: boardId }) })
      const reqId = resp.headers.get('x-request-id') || ''
      const json = await resp.json().catch(()=>({}))
      if (!resp.ok || !json.success) {
        if (resp.status === 401) toast.error('Please re-connect this integration' + (reqId ? ` (Ref: ${reqId})` : ''))
        else toast.error((json.error || 'Failed to load jobs') + (reqId ? ` (Ref: ${reqId})` : ''))
        return
      }
      const jobs = (json.jobs || []).map((j: any) => ({ title: j.title || j.position || j.name, url: j.url || j.link, company: j.company || j.companyName, location: j.location }))
      setJobsByBoard(prev => ({ ...prev, [boardId]: jobs }))
      setJobsOpen(prev => ({ ...prev, [boardId]: true }))
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setJobsLoading(prev => ({ ...prev, [boardId]: false }))
    }
  }

  const getAutomationBadgeColor = (level: string) => {
    switch (level) {
      case 'full': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-muted text-foreground'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-muted text-foreground'
    }
  }

  // Stats calculation
  const stats = {
    totalBoards: jobBoards.length,
    connectedBoards: jobBoards.filter(b => b.status === 'connected').length,
    totalApplications: applications.length,
    successfulApplications: applications.filter(a => a.status === 'offer').length,
    automationRate: Math.round((jobBoards.filter(b => b.automationLevel === 'full').length / jobBoards.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="w-24 h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="w-full h-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected Boards</p>
                <p className="text-2xl font-bold">{stats.connectedBoards}/{stats.totalBoards}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">{stats.successfulApplications}/{stats.totalApplications}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Automation Rate</p>
                <p className="text-2xl font-bold">{stats.automationRate}%</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalApplications > 0
                    ? Math.round((stats.successfulApplications / stats.totalApplications) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Pilot Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-Pilot Mode
          </CardTitle>
          <CardDescription>
            Automatically find and apply to jobs matching your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Autopilot status */}
          <div className="mb-3 text-sm text-foreground">
            <AutopilotStatus />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Enable Auto-Pilot</h4>
              <p className="text-sm text-muted-foreground">
                Let Career Lever AI automatically find and apply to relevant positions
              </p>
            </div>
            <Button
              variant={autoPilotEnabled ? "default" : "outline"}
              onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
            >
              {autoPilotEnabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {autoPilotEnabled ? 'Disable' : 'Enable'} Auto-Pilot
            </Button>
          </div>

          {autoPilotEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-background rounded-lg">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dailyLimit">Daily Application Limit</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={autoPilotSettings.dailyLimit}
                    onChange={(e) => setAutoPilotSettings(prev => ({
                      ...prev,
                      dailyLimit: parseInt(e.target.value)
                    }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={autoPilotSettings.keywords}
                    onChange={(e) => setAutoPilotSettings(prev => ({
                      ...prev,
                      keywords: e.target.value
                    }))}
                    placeholder="e.g., software engineer, react, typescript"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="locations">Locations</Label>
                  <Input
                    id="locations"
                    value={autoPilotSettings.locations}
                    onChange={(e) => setAutoPilotSettings(prev => ({
                      ...prev,
                      locations: e.target.value
                    }))}
                    placeholder="e.g., San Francisco, Remote, New York"
                  />
                </div>
                <div>
                  <Label>Salary Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={autoPilotSettings.salaryRange.min}
                      onChange={(e) => setAutoPilotSettings(prev => ({
                        ...prev,
                        salaryRange: { ...prev.salaryRange, min: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={autoPilotSettings.salaryRange.max}
                      onChange={(e) => setAutoPilotSettings(prev => ({
                        ...prev,
                        salaryRange: { ...prev.salaryRange, max: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {autoPilotEnabled && (
            <div className="mt-4 flex items-center gap-3">
              <Button disabled={autoPilotRunning} onClick={async () => {
                setAutoPilotRunning(true)
                setProgress({ percent: 5, stage: 'Preparing search…' })
                try {
                  const controller = new AbortController()
                  const userTimeout = Math.max(30000, Math.min(180000, Number(autoPilotSettings.timeoutMs) || 120000))
                  const to = setTimeout(()=>controller.abort(), userTimeout)
                  // Faux staged progress while waiting (client-side only)
                  const start = Date.now()
                  const ticker = setInterval(() => {
                    const elapsed = Date.now() - start
                    const pct = Math.min(95, Math.round((elapsed / userTimeout) * 100))
                    const stage = pct < 30 ? 'Searching job boards…' : pct < 60 ? 'Aggregating listings…' : 'Finding contacts…'
                    setProgress({ percent: pct, stage })
                  }, 500)
                  const resp = await fetch('/api/job-boards/autopilot/search', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      keywords: autoPilotSettings.keywords, 
                      locations: autoPilotSettings.locations, 
                      radiusKm: 150, days: 30, limit: 20, timeoutMs: userTimeout,
                      mode: qualityMode,
                      filters
                    }),
                    signal: controller.signal
                  })
                  clearTimeout(to)
                  clearInterval(ticker)
                  const json = await resp.json()
                  if (!resp.ok || !json.success) throw new Error(json.error || 'Search failed')
                  setAutoPilotResults(json.results || [])
                  setProgress({ percent: 100, stage: 'Complete' })
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Autopilot search failed')
                  setProgress({ percent: 0, stage: 'Idle' })
                } finally {
                  setAutoPilotRunning(false)
                }
              }}>
                {autoPilotRunning ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Searching...</>) : (<><Zap className="w-4 h-4 mr-2"/>Run Autopilot Search</>)}
              </Button>
              {autoPilotResults.length > 0 && (
                <div className="text-sm text-muted-foreground">Found {autoPilotResults.length} public listings</div>
              )}
            </div>
          )}

          {autoPilotResults.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="text-sm font-medium mb-2">Public Listings</div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {autoPilotResults.slice(0, 100).map((j, idx) => (
                  <div key={idx} className="text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{j.title || 'Untitled role'}</div>
                      <div className="text-muted-foreground truncate">{[j.company, j.location, j.source].filter(Boolean).join(' • ')}</div>
                    </div>
                    {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 border rounded">Open</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {autoPilotRunning || progress.percent > 0 ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{progress.stage}</span>
                <span>{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} className="w-full" />
            </div>
          ) : null}

          {/* Filters and Mode */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Mode</Label>
              <Select value={qualityMode} onValueChange={(v)=>setQualityMode(v as any)}>
                <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="speed">Speed (Search/Sonar)</SelectItem>
                  <SelectItem value="quality">Quality (Sonar Pro/V2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Work Type</Label>
              <Select value={filters.workType} onValueChange={(v)=>setFilters(p=>({ ...p, workType: v as any }))}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Experience</Label>
              <Select value={filters.experienceLevel} onValueChange={(v)=>setFilters(p=>({ ...p, experienceLevel: v as any }))}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Min Salary (USD)</Label>
                <Input type="number" placeholder="e.g., 80000" value={filters.salaryMin || ''} onChange={(e)=>setFilters(p=>({ ...p, salaryMin: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div className="w-28">
                <Label className="text-xs">Max Results</Label>
                <Input type="number" value={filters.maxResults || 15} onChange={(e)=>setFilters(p=>({ ...p, maxResults: Math.max(5, Math.min(30, Number(e.target.value)||15)) }))} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Board integrations have moved to Settings → Integrations; no UI here by design */}

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Bulk Application Submission
          </CardTitle>
          <CardDescription>
            Submit multiple applications to selected job boards at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Application Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Select Applications ({selectedApplications.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
              {applications.slice(0, 10).map((app) => (
                <div key={app._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedApplications.includes(app._id)}
                    onCheckedChange={(checked) => handleApplicationSelection(app._id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.company}</p>
                  </div>
                  <Badge variant={app.status === 'submitted' ? 'default' : 'outline'} className="text-xs">
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Progress and Actions */}
          {bulkSubmission.status === 'running' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Submission Progress</span>
                <span>{Math.round(bulkSubmission.progress)}%</span>
              </div>
              <Progress value={bulkSubmission.progress} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                Submitting {bulkSubmission.selectedApplications.length} applications to {bulkSubmission.selectedBoards.length} job boards...
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleBulkSubmit}
              disabled={
                selectedBoards.length === 0 ||
                selectedApplications.length === 0 ||
                bulkSubmission.status === 'running'
              }
              className="flex-1"
            >
              {bulkSubmission.status === 'running' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit {selectedApplications.length} Applications
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedBoards([])
                setSelectedApplications([])
              }}
              disabled={bulkSubmission.status === 'running'}
            >
              Clear Selection
            </Button>
          </div>

          {bulkSubmission.status === 'completed' && bulkSubmission.results && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Bulk submission completed! {bulkSubmission.results.filter(r => r.success).length} successful submissions out of {bulkSubmission.results.length} attempts.
              </AlertDescription>
            </Alert>
          )}

          {bulkSubmission.status === 'failed' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Bulk submission failed. Please try again or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest application submissions and job board activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.slice(0, 5).map((app) => (
              <div key={app._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    app.status === 'submitted' ? 'bg-green-500' :
                    app.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <p className="font-medium">{app.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{app.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={app.status === 'submitted' ? 'default' : 'outline'}>
                    {app.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AutopilotStatus() {
  const [status, setStatus] = useState<{ lastRunAt?: string; lastFound?: number; nextRunAt?: string } | null>(null)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) return
        const j = await res.json()
        const meta = j?.profile?.autopilotMeta || {}
        setStatus({
          lastRunAt: meta.lastRunAt,
          lastFound: meta.lastFound,
          nextRunAt: meta.nextRunAt,
        })
      } catch {}
    })()
  }, [])
  if (!status) return null
  return (
    <div className="flex items-center gap-4">
      <div>Last run: {status.lastRunAt ? new Date(status.lastRunAt).toLocaleString() : '—'}</div>
      <div>Found: {typeof status.lastFound === 'number' ? status.lastFound : 0}</div>
      <div>Next run: {status.nextRunAt ? new Date(status.nextRunAt).toLocaleString() : '—'}</div>
    </div>
  )
}


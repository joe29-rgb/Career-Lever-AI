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
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false)
  const [autoPilotSettings, setAutoPilotSettings] = useState({
    dailyLimit: 10,
    jobBoards: [],
    keywords: '',
    locations: '',
    salaryRange: { min: 0, max: 0 }
  })

  // Load job boards and applications
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load available job boards
      const boardsResponse = await fetch('/api/job-boards/submit')
      const boardsData = await boardsResponse.json()

      // Load user's job applications
      const appsResponse = await fetch('/api/applications')
      const appsData = await appsResponse.json()

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
                resumeId: 'mock-resume-id', // In real implementation, get from application
                coverLetterId: 'mock-cover-id',
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

  const getAutomationBadgeColor = (level: string) => {
    switch (level) {
      case 'full': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
                <p className="text-sm font-medium text-gray-600">Connected Boards</p>
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
                <p className="text-sm font-medium text-gray-600">Applications</p>
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
                <p className="text-sm font-medium text-gray-600">Automation Rate</p>
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
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Enable Auto-Pilot</h4>
              <p className="text-sm text-gray-600">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
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
        </CardContent>
      </Card>

      {/* Job Boards Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Job Board Integrations</CardTitle>
          <CardDescription>
            Connect and manage your job board accounts for automated applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobBoards.map((board) => (
              <Card key={board.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedBoards.includes(board.id)}
                        onCheckedChange={(checked) => handleBoardSelection(board.id, checked as boolean)}
                      />
                      <div>
                        <h3 className="font-semibold">{board.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getAutomationBadgeColor(board.automationLevel)}>
                            {board.automationLevel} automation
                          </Badge>
                          <Badge className={getStatusBadgeColor(board.status)}>
                            {board.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${board.id}.com`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span>{board.successRate || 0}%</span>
                    </div>
                    <Progress value={board.successRate || 0} className="h-2" />

                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Applications</span>
                      <span>{board.totalApplications || 0}</span>
                    </div>

                    {board.lastUsed && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Last Used</span>
                        <span>{board.lastUsed.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {board.status !== 'connected' ? (
                      <Button
                        onClick={() => connectToBoard(board.id)}
                        className="flex-1"
                        size="sm"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          onClick={() => syncJobs(board.id)}
                          className="flex-1"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync Jobs
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {/* Open settings */}}
                          className="flex-1"
                          size="sm"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-1">
                      {board.features.fileUpload && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          File Upload
                        </Badge>
                      )}
                      {board.features.coverLetter && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Cover Letter
                        </Badge>
                      )}
                      {board.features.autoSubmit && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Auto Submit
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

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
                    <p className="text-xs text-gray-600 truncate">{app.company}</p>
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
              <p className="text-xs text-gray-600">
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
                    <p className="text-sm text-gray-600">{app.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={app.status === 'submitted' ? 'default' : 'outline'}>
                    {app.status}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">
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

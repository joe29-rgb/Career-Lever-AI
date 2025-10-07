'use client'

import { useEffect, useState } from 'react'

interface Board {
  id: string
  name: string
  automationLevel: 'full' | 'partial' | 'manual'
  status: 'connected' | 'disconnected' | 'error'
  features: { fileUpload: boolean; coverLetter: boolean; autoSubmit: boolean }
  lastUsed?: string
  successRate?: number
  totalApplications?: number
}

export default function IntegrationsSettingsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsOpen, setJobsOpen] = useState<Record<string, boolean>>({})
  const [jobsLoading, setJobsLoading] = useState<Record<string, boolean>>({})
  const [jobsByBoard, setJobsByBoard] = useState<Record<string, Array<{ title?: string; url?: string; company?: string; location?: string }>>>({})

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const boardsResponse = await fetch('/api/job-boards/submit')
        const boardsData = await boardsResponse.json()
        const integrationsResponse = await fetch('/api/job-boards/integrations')
        const integrationsData = await integrationsResponse.json()
        const enhanced = (boardsData.jobBoards || []).map((b: any) => {
          const integration = integrationsData.success ? integrationsData.integrations.find((i: any) => i.boardName === b.id) : null
          return {
            id: b.id,
            name: b.name,
            automationLevel: b.automationLevel,
            features: b.features,
            status: integration ? integration.status : 'disconnected',
            lastUsed: integration?.lastApplicationAt,
            successRate: integration ? Math.round((integration.successfulApplications / Math.max(integration.totalApplications, 1)) * 100) : 0,
            totalApplications: integration ? integration.totalApplications : 0,
          } as Board
        })
        setBoards(enhanced)
      } catch {}
      setLoading(false)
    })()
  }, [])

  const connectToBoard = async (boardId: string) => {
    try {
      const response = await fetch('/api/job-boards/oauth/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName: boardId }) })
      const data = await response.json()
      if (data.success && data.authUrl) window.location.href = data.authUrl
    } catch {}
  }

  const syncJobs = async (boardId: string) => {
    try {
      await fetch('/api/job-boards/jobs/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName: boardId }) })
    } catch {}
  }

  const loadBoardJobs = async (boardId: string) => {
    setJobsLoading(prev => ({ ...prev, [boardId]: true }))
    try {
      const resp = await fetch('/api/job-boards/jobs/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName: boardId }) })
      const json = await resp.json().catch(()=>({}))
      const jobs = (json.jobs || []).map((j: any) => ({ title: j.title || j.position || j.name, url: j.url || j.link, company: j.company || j.companyName, location: j.location }))
      setJobsByBoard(prev => ({ ...prev, [boardId]: jobs }))
      setJobsOpen(prev => ({ ...prev, [boardId]: true }))
    } catch {}
    setJobsLoading(prev => ({ ...prev, [boardId]: false }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Job Board Integrations</h2>
      <p className="text-sm text-muted-foreground">Connect and manage job board accounts. This enables syncing jobs and streamlined submissions.</p>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map(board => (
            <div key={board.id} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{board.name}</div>
                  <div className="text-xs text-muted-foreground">{board.automationLevel} automation · {board.status}</div>
                </div>
                <a className="text-xs underline" href={`https://${board.id}.com`} target="_blank" rel="noreferrer">Open</a>
              </div>
              <div className="text-xs text-foreground mb-2">Success {board.successRate || 0}% · {board.totalApplications || 0} applications</div>
              <div className="flex gap-2">
                {board.status !== 'connected' ? (
                  <button onClick={() => connectToBoard(board.id)} className="px-3 py-2 border rounded text-sm flex-1">Connect</button>
                ) : (
                  <>
                    <button onClick={() => syncJobs(board.id)} className="px-3 py-2 border rounded text-sm flex-1">Sync Jobs</button>
                    <button onClick={() => loadBoardJobs(board.id)} className="px-3 py-2 border rounded text-sm flex-1">{jobsLoading[board.id] ? 'Loading…' : 'View Jobs'}</button>
                  </>
                )}
              </div>
              {jobsOpen[board.id] && (jobsByBoard[board.id] || []).length > 0 && (
                <div className="mt-3 border-t pt-2 space-y-1 max-h-40 overflow-y-auto">
                  {(jobsByBoard[board.id] || []).slice(0, 25).map((j, idx) => (
                    <div key={idx} className="text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{j.title || 'Untitled role'}</div>
                        <div className="text-muted-foreground truncate">{[j.company, j.location].filter(Boolean).join(' • ')}</div>
                      </div>
                      {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 border rounded">Open</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




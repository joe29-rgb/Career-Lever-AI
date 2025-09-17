'use client'

import { useEffect, useState } from 'react'

export function JobsActions() {
  const [providers, setProviders] = useState<Array<{ id: string; name: string; status: string }>>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/job-boards/integrations')
        const j = await res.json()
        if (j.success && Array.isArray(j.integrations)) {
          setProviders(j.integrations.map((i: any) => ({ id: i.boardName, name: i.boardName, status: i.status })))
        }
      } catch {}
    })()
  }, [])

  const load = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/job-boards/jobs/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName: selected }) })
      const j = await res.json()
      setJobs(Array.isArray(j.jobs?.items) ? j.jobs.items : (Array.isArray(j.jobs) ? j.jobs : []))
    } catch { setJobs([]) }
    setLoading(false)
  }

  const importJob = async (url?: string) => {
    if (!url) return
    try {
      await fetch('/api/jobs/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl: url }) })
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={selected} onChange={(e)=>setSelected(e.target.value)} className="border rounded p-2">
          <option value="">Select connected provider</option>
          {providers.filter(p=>p.status==='connected').map((p)=> (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button onClick={load} disabled={!selected || loading} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'Loading…' : 'Load Jobs'}</button>
      </div>
      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.slice(0, 20).map((job: any, idx: number) => (
            <div key={idx} className="p-3 border rounded flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{job.title || job.name || 'Job'}</div>
                <div className="text-sm text-gray-600 truncate">{job.company || job.companyName || ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">View</a>}
                <button onClick={()=>importJob(job.url)} disabled={!job.url} className="px-2 py-1 border rounded text-sm">Import</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



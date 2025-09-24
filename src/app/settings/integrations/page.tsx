'use client'

import { useEffect, useState } from 'react'

type Integration = { boardName: string; boardDisplayName: string; status: string }

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/job-boards/integrations')
      if (r.ok) {
        const j = await r.json()
        setItems((j.integrations || []).map((x: any)=>({ boardName: x.boardName, boardDisplayName: x.boardDisplayName || x.boardName, status: x.status || 'unknown' })))
      }
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const connect = async (boardName: string) => {
    try { await fetch('/api/job-boards/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName, action: 'connect' }) }); load() } catch {}
  }
  const disconnect = async (boardName: string) => {
    try { await fetch('/api/job-boards/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boardName, action: 'disconnect' }) }); load() } catch {}
  }

  const candidates = ['indeed', 'linkedin', 'ziprecruiter', 'workopolis', 'jobbank']

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">Connect job boards to sync jobs and enable Auto‑Pilot submissions.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {candidates.map((b) => {
          const existing = items.find(i => i.boardName === b)
          return (
            <div key={b} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{b}</div>
                <div className="text-xs text-gray-600">{existing ? existing.status : 'disconnected'}</div>
              </div>
              <div>
                {existing ? (
                  <button onClick={()=>disconnect(b)} className="px-3 py-1 border rounded text-sm">Disconnect</button>
                ) : (
                  <button onClick={()=>connect(b)} className="px-3 py-1 border rounded text-sm">Connect</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}



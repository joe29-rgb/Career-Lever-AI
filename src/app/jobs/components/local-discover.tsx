'use client'

import { useEffect, useState } from 'react'

type Result = { title?: string; url: string; snippet?: string; source: string }

const SOURCE_OPTIONS = [
  { id: 'indeed', label: 'Indeed' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'ziprecruiter', label: 'ZipRecruiter' },
  { id: 'jobbank', label: 'Job Bank' },
  { id: 'workopolis', label: 'Workopolis' },
  { id: 'google', label: 'Google' },
]

export function LocalDiscover() {
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [radiusKm, setRadiusKm] = useState(25)
  const [sources, setSources] = useState<string[]>(['indeed','linkedin','google'])
  const [commuteFrom, setCommuteFrom] = useState('')
  const [commuteMode, setCommuteMode] = useState<'driving'|'walking'|'transit'>('driving')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [ranked, setRanked] = useState<Array<{ url: string; title?: string; companyName?: string; score: number; reasons: string[] }>>([])
  const [commutes, setCommutes] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const toggleSource = (id: string) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const runSearch = async () => {
    setLoading(true); setError(null); setResults([])
    try {
      // Auto-fill location from profile if empty
      let effectiveLocation = location
      if (!effectiveLocation) {
        try {
          const prof = await fetch('/api/profile')
          if (prof.ok) { const pj = await prof.json(); if (pj?.profile?.location) effectiveLocation = pj.profile.location }
        } catch {}
      }
      const resp = await fetch('/api/v2/jobs/discover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, location: effectiveLocation, radiusKm, sources, commuteFrom: commuteFrom || undefined, commuteMode })
      })
      const reqId = resp.headers.get('x-request-id') || ''
      const json = await resp.json().catch(()=>({}))
      if (!resp.ok || !json.success) {
        if (resp.status === 401) { setError('Please sign in' + (reqId ? ` (Ref: ${reqId})` : '')); return }
        if (resp.status === 429) { setError((json.error || 'Rate limit exceeded') + (reqId ? ` (Ref: ${reqId})` : '')); return }
        if (resp.status >= 500) { setError('Server error during search' + (reqId ? ` (Ref: ${reqId})` : '')); return }
        throw new Error(json.error || 'Search failed')
      }
      const items = (json.results || []) as Result[]
      setResults(items)
      // Rank against latest resume
      try {
        const rankResp = await fetch('/api/v2/jobs/rank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobs: items }) })
        const rj = await rankResp.json().catch(()=>({}))
        if (rankResp.ok && rj.success) setRanked(rj.rankings || [])
      } catch {}
      // Commute estimates
      if (commuteFrom && items.length) {
        const out: Record<string, number> = {}
        for (const it of items.slice(0, 12)) {
          try {
            const c = await fetch('/api/commute/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin: commuteFrom, destination: `${it.title || ''} ${location}`.trim(), mode: commuteMode }) })
            const cj = await c.json()
            if (c.ok && cj.success) out[it.url] = cj.minutes
          } catch {}
        }
        setCommutes(out)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Local Job Search</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border rounded p-2" placeholder="Job title (e.g., Sales Manager)" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} />
        <input className="border rounded p-2" placeholder="Location (e.g., Edmonton, AB)" value={location} onChange={e=>setLocation(e.target.value)} />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Radius</label>
          <input type="number" min={1} max={500} className="border rounded p-2 w-24" value={radiusKm} onChange={e=>setRadiusKm(parseInt(e.target.value||'25',10))} />
          <span className="text-sm">km</span>
        </div>
        <button onClick={runSearch} disabled={loading || !jobTitle} className="border rounded p-2 bg-blue-600 text-foreground disabled:opacity-50">{loading ? 'Searching…' : 'Search'}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border rounded p-2" placeholder="Commute from (address/city)" value={commuteFrom} onChange={e=>setCommuteFrom(e.target.value)} />
        <select className="border rounded p-2" value={commuteMode} onChange={e=>setCommuteMode(e.target.value as any)}>
          <option value="driving">Driving</option>
          <option value="walking">Walking</option>
          <option value="transit">Transit</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-3">
        {SOURCE_OPTIONS.map(s => (
          <label key={s.id} className={`px-3 py-1 border rounded text-sm cursor-pointer ${sources.includes(s.id) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white'}`}>
            <input type="checkbox" checked={sources.includes(s.id)} onChange={()=>toggleSource(s.id)} className="mr-2" />{s.label}
          </label>
        ))}
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((r, i) => {
            const scored = ranked.find(x => x.url === r.url)
            return (
            <div key={`${r.url}-${i}`} className="border rounded p-3 bg-card">
              <div className="text-sm text-muted-foreground mb-1">{r.source}</div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 dark:text-blue-300 line-clamp-2">{r.title || r.url}</a>
              {r.snippet && <div className="text-sm text-foreground dark:text-gray-300 mt-1 line-clamp-3">{r.snippet}</div>}
              {(scored || commutes[r.url] != null) && (
                <div className="mt-2 text-xs">
                  {scored && <div className="font-medium">Fit Score: {scored.score}%</div>}
                  {commutes[r.url] != null && <div className="text-muted-foreground">Commute: {commutes[r.url]} mins ({commuteMode})</div>}
                  {scored && scored.reasons && scored.reasons.length > 0 && (
                    <ul className="list-disc ml-5 mt-1">
                      {scored.reasons.slice(0,2).map((rs,idx)=>(<li key={idx}>{rs}</li>))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 border rounded">Open</a>
                <a href="/create-application?step=analyze" className="text-xs px-2 py-1 border rounded">Analyze</a>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}




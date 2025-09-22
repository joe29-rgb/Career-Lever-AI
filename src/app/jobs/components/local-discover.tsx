'use client'

import { useState } from 'react'

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
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState<string | null>(null)

  const toggleSource = (id: string) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const runSearch = async () => {
    setLoading(true); setError(null); setResults([])
    try {
      const resp = await fetch('/api/v2/jobs/discover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, location, radiusKm, sources })
      })
      const json = await resp.json()
      if (!resp.ok || !json.success) throw new Error(json.error || 'Search failed')
      setResults(json.results || [])
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
          <label className="text-sm text-gray-600">Radius</label>
          <input type="number" min={1} max={500} className="border rounded p-2 w-24" value={radiusKm} onChange={e=>setRadiusKm(parseInt(e.target.value||'25',10))} />
          <span className="text-sm">km</span>
        </div>
        <button onClick={runSearch} disabled={loading || !jobTitle} className="border rounded p-2 bg-blue-600 text-white disabled:opacity-50">{loading ? 'Searching…' : 'Search'}</button>
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
          {results.map((r, i) => (
            <div key={`${r.url}-${i}`} className="border rounded p-3 bg-white dark:bg-gray-900">
              <div className="text-sm text-gray-500 mb-1">{r.source}</div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 dark:text-blue-300 line-clamp-2">{r.title || r.url}</a>
              {r.snippet && <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-3">{r.snippet}</div>}
              <div className="mt-2 flex gap-2">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 border rounded">Open</a>
                <a href="/create-application?step=analyze" className="text-xs px-2 py-1 border rounded">Analyze</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



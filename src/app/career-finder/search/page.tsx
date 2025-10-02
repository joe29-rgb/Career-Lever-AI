'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function inferLocationFromText(text: string): string | '' {
  try {
    const header = text.split(/\n|\r/).slice(0, 40).join(' ')
    // Try City, Province code (e.g., Edmonton, AB)
    const m = header.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*),\s*([A-Z]{2})\b/)
    if (m && m[0]) return m[0]
    // Try City, Province full name
    const provinces = '(Alberta|British Columbia|Ontario|Quebec|Saskatchewan|Manitoba|New Brunswick|Nova Scotia|Prince Edward Island|Newfoundland and Labrador)'
    const reFull = new RegExp(`([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*),\\s*${provinces}`)
    const f = header.match(reFull)
    if (f && f[0]) return f[0]
  } catch {}
  return ''
}

export default function CareerFinderSearchPage() {
  const [keywords, setKeywords] = useState('')
  const [locations, setLocations] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const router = useRouter()
  const [radiusKm, setRadiusKm] = useState(75)
  const [days, setDays] = useState(10)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/profile')
        if (r.ok) {
          const j = await r.json()
          const p = j?.profile || {}
          if (p.location) setLocations(p.location)
          const ap = p?.preferences?.autopilot || {}
          if (typeof ap.radiusKm === 'number') setRadiusKm(Math.max(1, Math.min(500, ap.radiusKm)))
          if (typeof ap.days === 'number') setDays(Math.max(1, Math.min(90, ap.days)))
        }
      } catch {}
      try {
        const rl = await fetch('/api/resume/list')
        if (rl.ok) {
          const rj = await rl.json()
          const txt: string = rj?.resumes?.[0]?.extractedText || ''
          if (txt && txt.length > 50) {
            const first = txt.split(/\n|\r/).slice(0, 12).join(' ')
            const words = first.match(/[A-Za-z][A-Za-z+\-]{2,}/g) || []
            const top = Array.from(new Set(words)).slice(0, 8).join(', ')
            if (top) setKeywords(top)
            if (!locations) {
              const loc = inferLocationFromText(txt)
              if (loc) setLocations(loc)
            }
          }
        }
      } catch {}
    })()
  }, [])

  const runSearch = async () => {
    setLoading(true)
    setResults([])
    try {
      const resp = await fetch('/api/job-boards/autopilot/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords, locations, radiusKm, days, limit: 20, mode: 'speed', domains: ['jobbank.gc.ca','indeed.ca','linkedin.com','workopolis.com','jobboom.com','glassdoor.ca','eluta.ca'] }) })
      const json = await resp.json()
      if (!resp.ok || json.error) throw new Error(json.error || 'search failed')
      setResults(json.results || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { runSearch() }, [])

  return (
    <div className="space-y-4">
      {(!keywords || !locations) && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">Tip: Keywords and location are prefilled from your resume and profile. Adjust if needed.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-gray-600">Keywords</div>
          <Input value={keywords} onChange={(e)=>setKeywords(e.target.value)} placeholder="e.g., software, react, node" />
        </div>
        <div>
          <div className="text-xs text-gray-600">Location</div>
          <Input value={locations} onChange={(e)=>setLocations(e.target.value)} placeholder="e.g., Edmonton, AB" />
        </div>
        <div className="flex items-end">
          <Button onClick={runSearch} disabled={loading}>{loading ? 'Searching…' : 'Refresh'}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {results.slice(0, 50).map((r, i) => (
          <div key={i} className="text-sm border rounded p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium truncate">{r.title || 'Untitled role'}</div>
              <div className="text-gray-600 truncate">{[r.company, r.location, r.source].filter(Boolean).join(' • ')}</div>
            </div>
            {r.url && (
              <button className="px-2 py-1 border rounded" onClick={async ()=>{
                try {
                  const imp = await fetch('/api/jobs/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl: r.url }) })
                  const jd = await imp.json().catch(()=>({}))
                  const sel = { url: r.url, title: r.title, company: r.company, location: r.location, description: (jd && (jd.description || jd.jobDescription)) || '' }
                  try { localStorage.setItem('cf:selectedJob', JSON.stringify(sel)) } catch {}
                  router.push('/career-finder/job')
                } catch { router.push('/career-finder/job') }
              }}>Select</button>
            )}
          </div>
        ))}
      </div>
      {(!loading && results.length === 0) && (
        <div className="text-xs text-gray-600">No results found. Try broadening keywords or increasing radius/days in Settings → Preferences.</div>
      )}
      {results.length > 0 && (
        <div className="mt-3 text-right">
          <button className="px-3 py-2 border rounded" onClick={()=>{
            try {
              const top = results[0]
              const sel = { url: top.url, title: top.title, company: top.company, location: top.location }
              localStorage.setItem('cf:topChoice', JSON.stringify(sel))
            } catch {}
          }}>Set Top Choice</button>
        </div>
      )}
      <div className="text-right">
        <a className="inline-block px-4 py-2 border rounded" href="/career-finder/job">Next</a>
      </div>
    </div>
  )
}



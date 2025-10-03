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
  const [hasTopChoice, setHasTopChoice] = useState(false)
  const [topChoiceUrl, setTopChoiceUrl] = useState<string>('')

  useEffect(() => {
    (async () => {
      try { localStorage.setItem('cf:progress', JSON.stringify({ step: 2, total: 7 })) } catch {}
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
      // Server-side extraction to ensure correctness
      try {
        const sig = await fetch('/api/resume/signals')
        if (sig.ok) {
          const s = await sig.json()
          if (Array.isArray(s.keywords) && s.keywords.length && !keywords) {
            setKeywords(s.keywords.slice(0, 12).join(', '))
            try { localStorage.setItem('cf:signals:keywords', JSON.stringify(s.keywords)) } catch {}
          }
          if (s.location && !locations) {
            setLocations(s.location)
            try { localStorage.setItem('cf:signals:location', s.location) } catch {}
          }
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
      // Initialize top choice state
      try { setHasTopChoice(!!localStorage.getItem('cf:topChoice')) } catch {}
      // If Autopilot is ready from previous upload/build, auto-run
      try { if (localStorage.getItem('cf:autopilotReady') === '1') runSearch() } catch {}
    })()
  }, [])

  const runSearch = async () => {
    setLoading(true)
    setResults([])
    try {
      const resp = await fetch('/api/job-boards/autopilot/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords, locations, radiusKm: 75, days: 10, limit: 20, mode: 'speed', domains: ['jobbank.gc.ca','indeed.ca','linkedin.com','workopolis.com','jobboom.com','glassdoor.ca','eluta.ca'], filters: { salaryMin: 0, salaryMax: 100000, maxResults: 20 } }) })
      const json = await resp.json()
      if (!resp.ok || json.error) throw new Error(json.error || 'search failed')
      // Filter client-side to last 10 days if server returns broader range
      const cutoff = Date.now() - 10*24*60*60*1000
      const filtered = (json.results || []).filter((r:any)=> !r.postedDate || (new Date(r.postedDate).getTime() >= cutoff))
      setResults(filtered)
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
          <input className="input input-mobile" value={keywords} onChange={(e)=>setKeywords(e.target.value)} placeholder="e.g., software, react, node" />
        </div>
        <div>
          <div className="text-xs text-gray-600">Location</div>
          <input className="input input-mobile" value={locations} onChange={(e)=>setLocations(e.target.value)} placeholder="e.g., Edmonton, AB" />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary btn-mobile" onClick={runSearch} disabled={loading}>{loading ? 'Searching…' : 'Refresh'}</button>
        </div>
      </div>
      <div className="space-y-2">
        {results.slice(0, 50).map((r, i) => (
          <div key={i} className={`text-sm border rounded p-3 flex items-center justify-between gap-2 ${topChoiceUrl===r.url?'ring-2 ring-blue-500':''}`}>
            <div className="min-w-0">
              <div className="font-medium truncate">{r.title || 'Untitled role'}</div>
              <div className="text-gray-600 truncate">{[r.company, r.location].filter(Boolean).join(' • ')}</div>
              <div className="text-xs text-gray-700">
                {r.salary || r.pay ? <span className="mr-2">{r.salary || r.pay}</span> : null}
                {r.postedDate ? <span className="text-gray-500">Posted: {new Date(r.postedDate).toLocaleDateString()}</span> : null}
              </div>
              <div className="flex gap-2 items-center mt-1">
                {r.url && <a className="text-xs text-blue-600 underline truncate max-w-[240px]" href={r.url} target="_blank" rel="noopener noreferrer">Open posting</a>}
                {r.source && <span className="text-xs text-gray-500">{r.source}</span>}
              </div>
            </div>
            {r.url && (
              <div className="flex flex-col gap-2 shrink-0">
                <button className="btn btn-secondary btn-mobile" onClick={async ()=>{
                  try {
                    const imp = await fetch('/api/jobs/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl: r.url }) })
                    const jd = await imp.json().catch(()=>({}))
                    const sel = { url: r.url, title: r.title, company: r.company, location: r.location, description: (jd && (jd.description || jd.jobDescription)) || '' }
                    try { localStorage.setItem('cf:selectedJob', JSON.stringify(sel)) } catch {}
                    router.push('/career-finder/job')
                  } catch { router.push('/career-finder/job') }
                }}>Select</button>
                <button className={`btn btn-ghost btn-mobile ${topChoiceUrl===r.url?'bg-blue-50 border-blue-500':''}`} onClick={()=>{
                  try {
                    const sel = { url: r.url, title: r.title, company: r.company, location: r.location }
                    localStorage.setItem('cf:topChoice', JSON.stringify(sel))
                    setTopChoiceUrl(r.url || '')
                    setHasTopChoice(true)
                    try { localStorage.removeItem('cf:autopilotReady') } catch {}
                  } catch {}
                }}>Top Choice</button>
              </div>
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
              setHasTopChoice(true)
              try { localStorage.removeItem('cf:autopilotReady') } catch {}
            } catch {}
          }}>Set Top Choice</button>
        </div>
      )}
      <div className="text-right">
        {hasTopChoice ? (
          <a className="inline-block px-4 py-2 border rounded" href="/career-finder/job">Next</a>
        ) : (
          <button className="inline-block px-4 py-2 border rounded opacity-60" disabled>Select a Top Choice to continue</button>
        )}
      </div>
    </div>
  )
}



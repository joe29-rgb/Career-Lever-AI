"use client"
import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [useResume, setUseResume] = useState(true)
  const [allowPublicScraping, setAllowPublicScraping] = useState(true)
  const [defaultRadiusKm, setDefaultRadiusKm] = useState(150)
  const [defaultDays, setDefaultDays] = useState(30)
  const [defaultMaxResults, setDefaultMaxResults] = useState(15)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/profile')
        if (r.ok) {
          const j = await r.json()
          const prefs = j?.profile?.preferences || {}
          setUseResume(prefs?.autopilot?.useResume !== false)
          setAllowPublicScraping(prefs?.autopilot?.allowPublicScraping !== false)
          setDefaultRadiusKm(typeof prefs?.autopilot?.radiusKm === 'number' ? prefs.autopilot.radiusKm : 150)
          setDefaultDays(typeof prefs?.autopilot?.days === 'number' ? prefs.autopilot.days : 30)
          setDefaultMaxResults(typeof prefs?.autopilot?.maxResults === 'number' ? prefs.autopilot.maxResults : 15)
        }
      } finally { setLoading(false) }
    })()
  }, [])

  const save = async () => {
    setSaving(true); setMessage('')
    try {
      const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        preferences: { autopilot: { useResume, allowPublicScraping, radiusKm: defaultRadiusKm, days: defaultDays, maxResults: defaultMaxResults } }
      }) })
      setMessage(r.ok ? 'Saved' : 'Failed to save')
    } catch { setMessage('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="text-sm">Loading…</div>

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Preferences</div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input id="useResume" type="checkbox" checked={useResume} onChange={(e)=>setUseResume(e.target.checked)} />
          <label htmlFor="useResume" className="text-sm">Use my resume to prefill Autopilot</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="allowScrape" type="checkbox" checked={allowPublicScraping} onChange={(e)=>setAllowPublicScraping(e.target.checked)} />
          <label htmlFor="allowScrape" className="text-sm">Allow public web scraping for job discovery</label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div>Default radius (km)</div>
            <input type="number" className="border rounded p-2 w-full" value={defaultRadiusKm} onChange={(e)=>setDefaultRadiusKm(Math.max(1, Math.min(500, Number(e.target.value)||150)))} />
          </div>
          <div>
            <div>Default lookback (days)</div>
            <input type="number" className="border rounded p-2 w-full" value={defaultDays} onChange={(e)=>setDefaultDays(Math.max(1, Math.min(90, Number(e.target.value)||30)))} />
          </div>
          <div>
            <div>Max results</div>
            <input type="number" className="border rounded p-2 w-full" value={defaultMaxResults} onChange={(e)=>setDefaultMaxResults(Math.max(5, Math.min(30, Number(e.target.value)||15)))} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 border rounded bg-blue-600 text-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        {message && <div className="text-sm">{message}</div>}
      </div>
    </div>
  )
}


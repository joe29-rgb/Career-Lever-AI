'use client'

import { useEffect, useState } from 'react'

export default function AlertsSettingsPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/profile')
        if (r.ok) {
          const j = await r.json()
          const prefs = j?.profile?.preferences || {}
          setLocation(j?.profile?.location || prefs?.alerts?.location || '')
          setJobTitle(prefs?.alerts?.jobTitle || '')
        }
      } catch {}
    })()
  }, [])

  const save = async () => {
    setSaving(true); setMessage('')
    try {
      const r = await fetch('/api/alerts/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobTitle, location, frequency: 'daily' }) })
      if (r.ok) setMessage('Saved. You will receive daily job suggestions.')
      else setMessage('Failed to save. Please try again.')
    } catch {
      setMessage('Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Daily job suggestions will be sent and shown in the Dashboard Action Center. A Railway cron calls /api/alerts/run.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border rounded p-2" placeholder="Target job title (e.g., Sales Manager)" value={jobTitle} onChange={(e)=>setJobTitle(e.target.value)} />
        <input className="border rounded p-2" placeholder="Location (e.g., Edmonton, AB)" value={location} onChange={(e)=>setLocation(e.target.value)} />
      </div>
      <button onClick={save} disabled={saving || !jobTitle} className="px-4 py-2 border rounded bg-blue-600 text-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save Preferences'}</button>
      {message && <div className="text-sm">{message}</div>}
    </div>
  )
}




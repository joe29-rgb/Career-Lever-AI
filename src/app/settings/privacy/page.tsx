'use client'

import { useEffect, useState } from 'react'

export default function PrivacySettingsPage() {
  const [useResumeForAutopilot, setUseResumeForAutopilot] = useState(true)
  const [allowPublicScraping, setAllowPublicScraping] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/profile')
        if (r.ok) {
          const j = await r.json()
          const prefs = j?.profile?.preferences || {}
          setUseResumeForAutopilot(prefs?.autopilot?.useResume !== false)
          setAllowPublicScraping(prefs?.autopilot?.allowPublicScraping !== false)
        }
      } catch {}
    })()
  }, [])

  const save = async () => {
    setSaving(true); setMessage('')
    try {
      const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        preferences: { autopilot: { useResume: useResumeForAutopilot, allowPublicScraping } }
      }) })
      setMessage(r.ok ? 'Saved' : 'Failed to save')
    } catch { setMessage('Failed to save') }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Privacy Controls</h2>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useResumeForAutopilot} onChange={e=>setUseResumeForAutopilot(e.target.checked)} />
          Use my resume to power Autopilot (extract keywords, titles, location)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allowPublicScraping} onChange={e=>setAllowPublicScraping(e.target.checked)} />
          Allow searching public job listings via search engines
        </label>
      </div>
      <button onClick={save} disabled={saving} className="px-3 py-2 border rounded text-sm">{saving ? 'Saving…' : 'Save'}</button>
      {message && <div className="text-sm">{message}</div>}
    </div>
  )
}



'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type JobItem = { title?: string; url: string; company?: string; location?: string; source?: string }

export default function OnboardingPage() {
  const [step, setStep] = useState<'welcome' | 'upload' | 'autopilot' | 'review' | 'done'>('welcome')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [resumeFound, setResumeFound] = useState(false)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [p, r] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/resume/list')
        ])
        if (p.ok) { const pj = await p.json(); setProfile(pj.profile) }
        if (r.ok) { const rj = await r.json(); setResumeFound((rj.resumes || []).length > 0) }
      } catch {}
    })()
  }, [])

  const startAutopilot = async () => {
    setLoading(true)
    setMessage('Searching public job boards…')
    try {
      const keywords = (profile?.skills && Array.isArray(profile.skills) && profile.skills.length) ? profile.skills.slice(0, 8).join(', ') : ''
      const locations = typeof profile?.location === 'string' ? profile.location : ''
      const resp = await fetch('/api/job-boards/autopilot/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, locations, radiusKm: 150, days: 30, limit: 20 })
      })
      const json = await resp.json().catch(()=>({}))
      if (!resp.ok || !json.success) throw new Error(json.error || 'Search failed')
      setJobs(json.results || [])
      setStep('review')
    } catch (e: any) {
      setMessage(e?.message || 'Search failed. Please try again.')
    } finally { setLoading(false) }
  }

  const useSelectedJob = async () => {
    if (selectedIdx == null) return
    const j = jobs[selectedIdx]
    try {
      // Prefill for analyze step via localStorage bridge
      if (j?.title) localStorage.setItem('job:title', j.title)
      if (j?.company) localStorage.setItem('job:company', j.company)
      if (j?.url) localStorage.setItem('job:url', j.url)
    } catch {}
    // Mark onboarding complete
    try { await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: { onboardingCompleted: true } }) }) } catch {}
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome to Career Lever</h1>
          <p className="text-sm text-foreground">Well set you up with resume and job matches in a few steps.</p>
        </div>

        {step === 'welcome' && (
          <div className="space-y-4 bg-card/70 backdrop-blur rounded-lg p-6 border">
            <div className="text-sm text-foreground">Start by uploading a resume or build one.</div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border rounded" onClick={() => setStep('upload')}>Upload Resume</button>
              <Link className="px-4 py-2 border rounded" href="/resume-builder">Build a Resume</Link>
              {resumeFound && <button className="px-4 py-2 border rounded" onClick={() => setStep('autopilot')}>Use Existing Resume</button>}
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4 bg-card/70 backdrop-blur rounded-lg p-6 border">
            <div className="text-sm text-foreground">Upload PDF resume. Well extract keywords and location automatically.</div>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault(); setLoading(true); setMessage('Uploading resume…')
              const form = e.target as HTMLFormElement
              const fd = new FormData(form)
              try {
                const r = await fetch('/api/resume/upload', { method: 'POST', body: fd })
                if (r.ok) { setStep('autopilot') } else { setMessage('Upload failed') }
              } catch { setMessage('Upload failed') }
              setLoading(false)
            }}>
              <input type="file" name="resume" accept="application/pdf" className="block" required />
              <button type="submit" className="px-4 py-2 border rounded">Upload</button>
              {message && <div className="text-xs text-muted-foreground">{message}</div>}
            </form>
          </div>
        )}

        {step === 'autopilot' && (
          <div className="space-y-4 bg-card/70 backdrop-blur rounded-lg p-6 border">
            <div className="text-sm text-foreground">Were finding public listings that match your resume.</div>
            <button onClick={startAutopilot} disabled={loading} className="px-4 py-2 border rounded">{loading ? 'Searching…' : 'Start Search'}</button>
            {loading && (
              <div className="mt-4">
                <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
                  <div className="h-2 w-2/3 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
                </div>
                <div className="text-xs text-muted-foreground mt-2">{message}</div>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 bg-card/70 backdrop-blur rounded-lg p-6 border">
            <div className="text-sm text-foreground">Select a job to proceed through Analyze → Research → Customize.</div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {jobs.map((j, idx) => (
                <div key={idx} className={`border rounded p-3 flex items-center justify-between ${selectedIdx===idx?'border-blue-500 bg-blue-50':'border-gray-200'}`}>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{j.title || 'Untitled role'}</div>
                    <div className="text-xs text-muted-foreground truncate">{[j.company, j.location, j.source].filter(Boolean).join(' • ')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 border rounded text-xs">Open</a>}
                    <button className="px-2 py-1 border rounded text-xs" onClick={()=>setSelectedIdx(idx)}>{selectedIdx===idx?'Selected':'Select'}</button>
                  </div>
                </div>
              ))}
              {jobs.length===0 && <div className="text-xs text-muted-foreground">No results. Try running search again.</div>}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setStep('autopilot')} className="px-3 py-2 border rounded text-sm">Run Again</button>
              <button onClick={useSelectedJob} disabled={selectedIdx==null} className="px-3 py-2 border rounded text-sm">Use This Job</button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 bg-card/70 backdrop-blur rounded-lg p-6 border text-center">
            <div className="text-sm text-foreground">Great! Lets analyze the job next.</div>
            <Link className="px-4 py-2 border rounded" href="/create-application?step=analyze">Go to Analyze</Link>
          </div>
        )}
      </div>
    </div>
  )
}




'use client'

import { useEffect, useMemo, useState } from 'react'

type Showcase = {
  _id: string
  headline: string
  anonymous: boolean
  skills: string[]
  desiredRoles: string[]
  location?: string
  availability?: 'immediate' | '2-weeks' | '1-month' | 'flexible'
  minSalary?: string
  summary?: string
  links?: Array<{ label: string; url: string }>
}

export default function ReverseMarketClient() {
  const [loading, setLoading] = useState(false)
  const [mine, setMine] = useState(true)
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [headline, setHeadline] = useState('')
  const [skills, setSkills] = useState('')
  const [desiredRoles, setDesiredRoles] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [summary, setSummary] = useState('')
  const [location, setLocation] = useState('')
  const [minSalary, setMinSalary] = useState('')

  const fetchShowcases = async () => {
    setLoading(true)
    try {
      const url = `/api/reverse-market/showcases?${mine ? 'mine=true' : ''}`
      const resp = await fetch(url)
      const data = await resp.json()
      if (resp.ok) setShowcases(data.showcases || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchShowcases() }, [mine])

  const onCreate = async () => {
    if (!headline.trim()) return
    setLoading(true)
    try {
      const resp = await fetch('/api/reverse-market/showcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim(),
          anonymous,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          desiredRoles: desiredRoles.split(',').map(s => s.trim()).filter(Boolean),
          summary: summary.trim() || undefined,
          location: location.trim() || undefined,
          minSalary: minSalary.trim() || undefined,
        })
      })
      if (resp.ok) {
        setHeadline('')
        setSkills('')
        setDesiredRoles('')
        setSummary('')
        setLocation('')
        setMinSalary('')
        await fetchShowcases()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Headline</label>
          <input className="border rounded px-3 py-2 w-full" value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Senior Full-Stack Engineer (TypeScript/React/Node)" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Skills (comma separated)</label>
          <input className="border rounded px-3 py-2 w-full" value={skills} onChange={e=>setSkills(e.target.value)} placeholder="TypeScript, React, Node, AWS" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Desired Roles (comma separated)</label>
          <input className="border rounded px-3 py-2 w-full" value={desiredRoles} onChange={e=>setDesiredRoles(e.target.value)} placeholder="Senior Engineer, Tech Lead" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <input className="border rounded px-3 py-2 w-full" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Remote / Toronto, ON" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum Salary</label>
          <input className="border rounded px-3 py-2 w-full" value={minSalary} onChange={e=>setMinSalary(e.target.value)} placeholder="$150k+ USD" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Summary</label>
          <textarea className="border rounded px-3 py-2 w-full" rows={3} value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Brief pitch about your experience and value" />
        </div>
        <div className="flex items-center gap-3">
          <input id="anonymous" type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} />
          <label htmlFor="anonymous" className="text-sm">Anonymous</label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-foreground disabled:opacity-60" onClick={onCreate}>Create Showcase</button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)} />
          Show only my showcases
        </label>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background">
              <th className="text-left p-2">Headline</th>
              <th className="text-left p-2">Skills</th>
              <th className="text-left p-2">Desired Roles</th>
              <th className="text-left p-2">Anonymous</th>
            </tr>
          </thead>
          <tbody>
            {showcases.map(s => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.headline}</td>
                <td className="p-2">{s.skills?.join(', ')}</td>
                <td className="p-2">{s.desiredRoles?.join(', ')}</td>
                <td className="p-2">{s.anonymous ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {!showcases.length && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={4}>No showcases found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}




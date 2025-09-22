'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CompanyResearch() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  const fetchResearch = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v2/company/deep-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName, jobTitle }) })
      const json = await res.json()
      setData(json?.companyData || json?.research || json)
    } catch (e) {
      console.error('Research error', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="w-full border rounded p-2" placeholder="Company name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        <input className="w-full border rounded p-2" placeholder="Target role (optional)" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
      </div>
      <Button onClick={fetchResearch} disabled={loading}>{loading ? 'Researching…' : 'Deep Research'}</Button>

      {data && (
        <div className="mt-4 space-y-3">
          <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded border">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}




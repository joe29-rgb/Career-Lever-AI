'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CareerFinderJobPage() {
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        let selected: any = null
        try { selected = JSON.parse(localStorage.getItem('cf:selectedJob') || 'null') } catch {}
        const jd: string = selected?.description || ''
        const jt: string = selected?.title || ''
        const cn: string = selected?.company || ''
        const payload = jd && jd.length >= 50 ? { jobDescription: jd, jobTitle: jt, companyName: cn } : { jobDescription: '', jobTitle: jt, companyName: cn }
        const resp = await fetch('/api/job/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const j = await resp.json().catch(()=>({}))
        if (resp.ok) setAnalysis(j)
      } catch {}
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">Job analysis auto-runs when you arrive on this page.</div>
      {loading && <div className="text-sm">Analyzing job…</div>}
      {!loading && analysis && (
        <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded p-3">
            <div className="font-medium mb-1">Job Details</div>
            <div><span className="text-gray-600">Title:</span> {analysis?.analysis?.jobTitle || '-'}</div>
            <div><span className="text-gray-600">Company:</span> {analysis?.analysis?.companyName || '-'}</div>
            {analysis?.analysis?.salaryRange && <div><span className="text-gray-600">Salary Range:</span> {analysis.analysis.salaryRange}</div>}
          </div>
          <div className="border rounded p-3">
            <div className="font-medium mb-1">Keywords Found</div>
            <div className="text-xs text-gray-700 break-words">{(analysis?.keywords || []).join(', ')}</div>
          </div>
          <div className="border rounded p-3 md:col-span-2">
            <div className="font-medium mb-1">Key Requirements</div>
            <ul className="list-disc ml-5 space-y-1">
              {(analysis?.analysis?.keyRequirements || []).map((k: string, i: number)=>(<li key={i}>{k}</li>))}
            </ul>
          </div>
          <div className="border rounded p-3 md:col-span-2">
            <div className="font-medium mb-1">Responsibilities</div>
            <ul className="list-disc ml-5 space-y-1">
              {(analysis?.analysis?.responsibilities || []).map((k: string, i: number)=>(<li key={i}>{k}</li>))}
            </ul>
          </div>
        </div>
      )}
      <div className="text-right">
        {analysis?.analysis?.jobTitle ? (
          <a className="inline-block px-4 py-2 border rounded" href="/career-finder/company">Next</a>
        ) : (
          <button className="inline-block px-4 py-2 border rounded opacity-60" disabled>Awaiting job description</button>
        )}
      </div>
    </div>
  )
}



'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

export default function CareerFinderJobPage() {
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [compare, setCompare] = useState<{ score:number; matched:string[]; missing:string[]; suggestions?:string[] }|null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try { localStorage.setItem('cf:progress', JSON.stringify({ step: 3, total: 7 })) } catch {}
      try {
        let selected: any = null
        try { selected = JSON.parse(localStorage.getItem('cf:selectedJob') || 'null') } catch {}
        const jd: string = selected?.description || ''
        const jt: string = selected?.title || ''
        const cn: string = selected?.company || ''
        // If description is missing, request server to import by URL best-effort
        const payload = jd && jd.length >= 50 ? { jobDescription: jd, jobTitle: jt, companyName: cn } : { jobDescription: '', jobTitle: jt, companyName: cn, jobUrl: selected?.url }
        const resp = await fetch('/api/job/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const j = await resp.json().catch(()=>({}))
        if (resp.ok) {
          setAnalysis(j)
          // Attempt resume comparison automatically
          try {
            let resumeId: string | undefined
            let resumeText: string | undefined
            const rl = await fetch('/api/resume/list')
            if (rl.ok) { const rj = await rl.json(); resumeId = rj.resumes?.[0]?._id; resumeText = rj.resumes?.[0]?.extractedText }
            const cmp = await fetch('/api/job/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobAnalysis: j, resumeId, resumeText }) })
            if (cmp.ok) {
              const cj = await cmp.json(); setCompare({ score: cj.score, matched: cj.matchedKeywords||[], missing: cj.missingKeywords||[], suggestions: cj.suggestions||[] })
            }
          } catch {}
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  return (
    <div className="mobile-container space-y-4">
      <CareerFinderBackButton />
      <div className="text-sm text-foreground">Job analysis auto-runs when you arrive on this page.</div>
      {loading && <div className="text-sm">Analyzing job…</div>}
      {!loading && analysis && (
        <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded p-3">
            <div className="font-medium mb-1">Job Details</div>
            <div><span className="text-muted-foreground">Title:</span> {analysis?.analysis?.jobTitle || '-'}</div>
            <div><span className="text-muted-foreground">Company:</span> {analysis?.analysis?.companyName || '-'}</div>
            {analysis?.analysis?.salaryRange && <div><span className="text-muted-foreground">Salary Range:</span> {analysis.analysis.salaryRange}</div>}
          </div>
          <div className="border rounded p-3">
            <div className="font-medium mb-1">Keywords Found</div>
            <div className="text-xs text-foreground break-words">{(analysis?.keywords || []).join(', ')}</div>
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
          {compare && (
            <div className="border rounded p-3 md:col-span-2">
              <div className="font-medium mb-1">Resume Match</div>
              <div className="flex items-center justify-between text-xs"><span>Score</span><span>{compare.score}%</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="text-xs font-semibold mb-1">Matched</div>
                  <div className="flex flex-wrap gap-1">{compare.matched.slice(0,20).map((kw,i)=>(<span key={i} className="px-2 py-1 border rounded text-[11px]">{kw}</span>))}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">Missing</div>
                  <div className="flex flex-wrap gap-1">{compare.missing.slice(0,20).map((kw,i)=>(<span key={i} className="px-2 py-1 border rounded text-[11px] opacity-70">{kw}</span>))}</div>
                </div>
              </div>
              {compare.suggestions && compare.suggestions.length>0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold mb-1">What to improve</div>
                  <ul className="list-disc ml-5 text-xs">{compare.suggestions.slice(0,4).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
                </div>
              )}
            </div>
          )}
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




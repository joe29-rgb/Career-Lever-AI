import CompanyResearch from '@/components/company-research'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function CareerFinderOutreachPage() {
  const [subjects, setSubjects] = useState<string[]>([])
  const [intros, setIntros] = useState<string[]>([])
  useEffect(() => {
    try {
      const job = JSON.parse(localStorage.getItem('cf:selectedJob') || 'null')
      const title = job?.title || 'Opportunity'
      const company = job?.company || 'Company'
      setSubjects([
        `${title} – Quick win for ${company}`,
        `15-min intro? ${title} at ${company}`,
        `${company}: ${title} value I can add`
      ])
      const letter = localStorage.getItem('cf:selectedCoverLetter') || ''
      setIntros([
        letter.slice(0, 600),
        `Hello – I’m reaching out regarding ${title} at ${company}. I’ve attached a tailored resume and cover letter; a quick conversation would be valuable.\n\nBest,`
      ])
    } catch {}
  }, [])
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">Select a contact and use the composer to send your intro. Applications will be tracked.</div>
      <div className="text-xs text-gray-600">After sending your email, click below to record the application:</div>
      <Button size="sm" variant="outline" onClick={async ()=>{
        try {
          const job = JSON.parse(localStorage.getItem('cf:selectedJob') || 'null')
          if (!job) return
          await fetch('/api/applications/mark-sent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobTitle: job.title, companyName: job.company, jobDescription: job.description || '', jobUrl: job.url }) })
          // Attempt to create Gmail label once
          await fetch('/api/inbox/label/create', { method: 'POST' }).catch(()=>{})
          // Attempt to create Outlook category once
          await fetch('/api/inbox/outlook/category/create', { method: 'POST' }).catch(()=>{})
        } catch {}
      }}>Mark as Sent</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3 text-sm">
          <div className="font-medium mb-2">Subject Lines</div>
          <ul className="space-y-1">
            {subjects.map((s,i)=>(<li key={i} className="flex items-center justify-between gap-2"><div className="truncate">{s}</div><Button size="sm" variant="outline" onClick={()=>navigator.clipboard.writeText(s)}>Copy</Button></li>))}
          </ul>
        </div>
        <div className="border rounded p-3 text-sm">
          <div className="font-medium mb-2">Intro Options</div>
          <ul className="space-y-2">
            {intros.map((t,i)=>(<li key={i} className="space-y-1"><div className="text-xs whitespace-pre-wrap">{t}</div><Button size="sm" variant="outline" onClick={()=>navigator.clipboard.writeText(t)}>Copy</Button></li>))}
          </ul>
        </div>
      </div>
      <CompanyResearch />
    </div>
  )
}



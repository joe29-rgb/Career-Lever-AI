'use client'

import { ResumeUpload } from '@/components/resume-upload'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CareerFinderResumePage() {
  const router = useRouter()
  const [hasResume, setHasResume] = useState<boolean>(false)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/resume/list')
        if (r.ok) {
          const j = await r.json()
          setHasResume(Array.isArray(j.resumes) && j.resumes.length > 0)
        }
      } catch {}
    })()
  }, [])
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">Upload your resume or build one. When done, proceed to search.</div>
      <ResumeUpload onUploadSuccess={() => router.push('/career-finder/search')} onUploadError={()=>{}} />
      <div className="text-sm">
        No resume? <Link className="underline" href="/resume-builder">Build one</Link>
      </div>
      <div className="text-right">
        {hasResume ? (
          <Link className="inline-block px-4 py-2 border rounded" href="/career-finder/search">Next</Link>
        ) : (
          <button className="inline-block px-4 py-2 border rounded opacity-60" onClick={()=>router.push('/resume-builder')}>Build Resume to Continue</button>
        )}
      </div>
    </div>
  )
}



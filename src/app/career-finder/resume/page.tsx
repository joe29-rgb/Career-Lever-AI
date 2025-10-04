'use client'

export const dynamic = 'force-dynamic'

import { ResumeUpload } from '@/components/resume-upload'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ResumeBuilder } from '@/app/resume-builder/components/resume-builder'

export default function CareerFinderResumePage() {
  const router = useRouter()
  const [hasResume, setHasResume] = useState<boolean>(false)
  // Show both Upload and Builder on this page, per spec
  useEffect(() => {
    (async () => {
      try { localStorage.setItem('cf:progress', JSON.stringify({ step: 1, total: 7 })) } catch {}
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
      <div className="mobile-container grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Resume Upload</h3>
          {/* Existing resumes selector (best-effort) */}
          <div className="mb-2 text-xs text-gray-600" id="existing-resumes"></div>
          <script dangerouslySetInnerHTML={{ __html: `
            (async function(){
              try{
                const c = document.getElementById('existing-resumes');
                const r = await fetch('/api/resume/list');
                if(!r.ok) return;
                const j = await r.json();
                if(Array.isArray(j.resumes) && j.resumes.length){
                  const s = document.createElement('select'); s.className='border rounded p-1'; s.onchange=function(){ try{localStorage.setItem('cf:selectedResumeId', this.value)}catch{}};
                  const o=document.createElement('option'); o.value=''; o.text='Select existing resume'; s.appendChild(o);
                  j.resumes.slice(0,10).forEach(function(res){ const opt=document.createElement('option'); opt.value=res._id; opt.text=(res.title||'Resume')+' • '+(new Date(res.createdAt||Date.now()).toLocaleDateString()); s.appendChild(opt); });
                  c.appendChild(s);
                }
              }catch{}
            })();
          ` }} />
          <ResumeUpload onUploadSuccess={()=>{ try { localStorage.setItem('cf:autopilotReady','1') } catch {} }} onUploadError={()=>{}} />
        </div>
        <div className="border rounded p-3">
          <h3 className="font-medium mb-2">Resume Content</h3>
          <ResumeBuilder userId="me" mode="contentOnly" />
          <div className="mt-3 text-right">
            <button className="px-3 py-2 border rounded" onClick={()=>{ try{ localStorage.setItem('cf:autopilotReady','1'); location.href='/career-finder/search'; }catch{ location.href='/career-finder/search'; } }}>Generate & Continue</button>
          </div>
        </div>
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



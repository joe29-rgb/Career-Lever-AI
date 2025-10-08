'use client'

export const dynamic = 'force-dynamic'

import { ResumeUpload } from '@/components/resume-upload'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ResumeBuilder } from '@/app/resume-builder/components/resume-builder'
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

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
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <div className="gradient-hero p-8 rounded-b-3xl shadow-2xl mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <CareerFinderBackButton />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-center mb-3">📄 Resume Manager</h1>
          <p className="text-foreground/90 text-center text-lg">Upload or build your resume to get started!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Card */}
          <div className="gradient-border-card hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text">Resume Upload</h3>
            </div>
            
            {/* Existing resumes selector (best-effort) */}
            <div className="mb-2 text-xs text-muted-foreground" id="existing-resumes"></div>
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

          {/* Builder Card */}
          <div className="gradient-border-card hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-accent-secondary">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-2xl font-bold gradient-text">
                Resume Builder
              </h3>
            </div>
            <ResumeBuilder userId="me" mode="contentOnly" />
            <div className="mt-6">
              <button 
                className="w-full btn-gradient text-lg py-4"
                onClick={()=>{ try{ localStorage.setItem('cf:autopilotReady','1'); location.href='/career-finder/search'; }catch{ location.href='/career-finder/search'; } }}
              >
                🚀 Generate & Continue
              </button>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="mt-8 text-center">
          {hasResume ? (
            <Link 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg font-bold text-foreground gradient-success"
              href="/career-finder/search"
            >
              <span>Next: Find Jobs</span>
              <span className="text-2xl">→</span>
            </Link>
          ) : (
            <button 
              className="inline-flex items-center gap-3 px-8 py-4 bg-muted text-muted-foreground font-bold rounded-2xl shadow-lg cursor-not-allowed text-lg"
              onClick={()=>router.push('/resume-builder')}
            >
              <span>📝 Build Resume First</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


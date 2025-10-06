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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Vibrant Header */}
      <div className="bg-gradient-to-r from-[#5324FD] via-[#F5001E] to-[#FCC636] p-8 rounded-b-3xl shadow-2xl mb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-3">📄 Resume Manager</h1>
          <p className="text-white/90 text-center text-lg">Upload or build your resume to get started!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VIBRANT Upload Card */}
          <div className="bg-gradient-to-br from-[#5324FD] to-[#8B5CF6] p-1 rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(83,36,253,0.4)] transition-all duration-300">
            <div className="bg-white rounded-[calc(1.5rem-1px)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-[#5324FD] to-[#F5001E] rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📤</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#5324FD] to-[#F5001E] bg-clip-text text-transparent">Resume Upload</h3>
              </div>
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
          </div>

          {/* VIBRANT Builder Card */}
          <div className="bg-gradient-to-br from-[#FCC636] to-[#FB923C] p-1 rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(252,198,54,0.4)] transition-all duration-300">
            <div className="bg-white rounded-[calc(1.5rem-1px)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-[#FCC636] to-[#F5001E] rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">✍️</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#FCC636] to-[#F5001E] bg-clip-text text-transparent">Resume Builder</h3>
              </div>
              <ResumeBuilder userId="me" mode="contentOnly" />
              <div className="mt-6">
                <button 
                  className="w-full bg-gradient-to-r from-[#FCC636] to-[#FB923C] text-gray-900 font-bold py-4 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg"
                  onClick={()=>{ try{ localStorage.setItem('cf:autopilotReady','1'); location.href='/career-finder/search'; }catch{ location.href='/career-finder/search'; } }}
                >
                  🚀 Generate & Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* VIBRANT Next Button */}
        <div className="mt-8 text-center">
          {hasResume ? (
            <Link 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg"
              href="/career-finder/search"
            >
              <span>Next: Find Jobs</span>
              <span className="text-2xl">→</span>
            </Link>
          ) : (
            <button 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-2xl shadow-lg cursor-not-allowed text-lg"
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



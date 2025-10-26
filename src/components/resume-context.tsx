'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ResumeItem = {
  _id: string
  originalFileName: string
  fileUrl?: string
  extractedText: string
  createdAt?: string
}

type ResumeContextValue = {
  resumes: ResumeItem[]
  selectedResumeId?: string
  selectedResume?: ResumeItem
  setSelectedResumeId: (id?: string) => void
  refresh: () => Promise<void>
}

const ResumeContext = createContext<ResumeContextValue | undefined>(undefined)

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResumeId, setSelectedResumeIdState] = useState<string | undefined>(undefined)

  const refresh = async () => {
    try {
      const resp = await fetch('/api/resume/list')
      if (resp.ok) {
        const data = await resp.json()
        const list = (data.resumes || []) as ResumeItem[]
        setResumes(list)
        if (!selectedResumeId && list.length) {
          const lastSaved = typeof window !== 'undefined' ? localStorage.getItem('resume:selected') || '' : ''
          const found = list.find(r => r._id === lastSaved) ? lastSaved : list[0]._id
          setSelectedResumeIdState(found)
        }
      } else if (resp.status === 401) {
        // Redirect to sign-in if not authenticated, but never from auth pages
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || '/'
          if (!path.startsWith('/auth')) {
            const back = encodeURIComponent(path + window.location.search)
            const safe = back.includes('%2Fauth') ? encodeURIComponent('/dashboard') : back
            window.location.href = `/auth/signin?callbackUrl=${safe}`
          }
        }
      }
    } catch {}
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setSelectedResumeId = (id?: string) => {
    setSelectedResumeIdState(id)
    try { if (id) localStorage.setItem('resume:selected', id) } catch {}
  }

  const selectedResume = useMemo(() => resumes.find(r => r._id === selectedResumeId), [resumes, selectedResumeId])

  const value: ResumeContextValue = {
    resumes,
    selectedResumeId,
    selectedResume,
    setSelectedResumeId,
    refresh,
  }

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  )
}

export function useResumeContext(): ResumeContextValue {
  const ctx = useContext(ResumeContext)
  if (!ctx) throw new Error('useResumeContext must be used within ResumeProvider')
  return ctx
}



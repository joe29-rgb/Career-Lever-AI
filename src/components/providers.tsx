'use client'

import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { ResumeProvider } from '@/components/resume-context'
import { initSentry, addRequestBreadcrumb } from '@/lib/sentry'
import toast from 'react-hot-toast'
import { createQueryClient } from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())
  const pathname = usePathname() || ''
  const DASHBOARD_PREFIXES = [
    '/dashboard',
    '/career-finder',
    '/analytics',
    '/job-boards',
    '/network',
    '/resume-builder',
    '/cover-letter',
    '/salary-negotiation',
    '/skill-analysis',
  ]
  const shouldMountResume = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))
  useEffect(() => {
    // Initialize Sentry once on client
    try { initSentry() } catch {}
    // Global fetch wrapper to capture x-request-id and add breadcrumbs
    try {
      const originalFetch = window.fetch
      if (!(originalFetch as any).__wrapped) {
        const wrapped = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          try {
            const resp = await originalFetch(input, init)
            const reqId = resp.headers.get('x-request-id') || ''
            if (reqId) addRequestBreadcrumb(reqId)
            
            // CRITICAL FIX: Only show automatic toasts if NOT explicitly disabled
            // APIs can set 'x-skip-auto-toast' header to handle their own error messages
            const skipAutoToast = resp.headers.get('x-skip-auto-toast') === 'true'
            
            // Minimal default toasts for unhandled auth/rate/server errors
            if (!resp.ok && !skipAutoToast) {
              if (resp.status === 401) { toast.error('Session expired. Please sign in.'); }
              else if (resp.status === 429) { toast.error('Rate limit exceeded. Please wait and try again.'); }
              else if (resp.status >= 500) { toast.error('Server error. Please try again later.'); }
            }
            return resp
          } catch (e) {
            toast.error('Network error. Check your connection and try again.')
            throw e
          }
        }
        ;(wrapped as any).__wrapped = true
        window.fetch = wrapped as typeof window.fetch
      }
    } catch {}
  }, [])
  const content = (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {shouldMountResume ? <ResumeProvider>{content}</ResumeProvider> : content}
      </QueryClientProvider>
    </SessionProvider>
  )
}




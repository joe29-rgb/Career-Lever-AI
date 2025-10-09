import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ThemeToggle } from '@/components/theme-toggle'
import { ClientInit } from '@/components/client-init'
import { AppShell } from '@/components/app-shell'
import { initSentry } from '@/lib/sentry'
import { ErrorBoundary } from '@/components/error-boundary'
import { logger } from '@/lib/logger'
import Link from 'next/link'
import { Toaster } from 'react-hot-toast'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { DebugPanel } from '@/components/debug-panel'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Career Lever AI - AI-Powered Job Application Assistant',
  description: 'Customize your resume and cover letters with AI to land your dream job. Get company insights, track applications, and boost your career success.',
  keywords: 'resume, job application, AI, career, recruitment, cover letter',
  icons: { icon: '/favicon.ico', apple: '/icon-192.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Career Lever AI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (typeof window !== 'undefined') {
    try { initSentry() } catch {}
  }
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen`}>
        <script dangerouslySetInnerHTML={{ __html: `try{(${function(){
          if(typeof window!=='undefined'){window.__initTheme||(window.__initTheme=true,document.documentElement.style.setProperty('--theme-transition','opacity 0.3s ease'),document.documentElement.classList.add('theme-anim'))}
        }.toString()})()}catch(e){}` }} />
        <ClientInit />
        <meta name="mobile-web-app-capable" content="yes" />
        <ErrorBoundary>
          <Providers>
            <AnalyticsTracker />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--primary)',
                    secondary: 'white',
                  },
                },
                error: {
                  duration: 6000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                },
              }}
            />
            <AppShell>{children}</AppShell>
            <DebugPanel />
          </Providers>
        </ErrorBoundary>
        {process.env.NEXT_PUBLIC_ENABLE_SW === 'true' ? (
          <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}` }} />
        ) : (
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs){
                  regs.forEach(function(r){ r.unregister().catch(function(){}) })
                }).catch(function(){})
              }
              if (window.caches && caches.keys) {
                caches.keys().then(function(keys){
                  keys.forEach(function(k){ caches.delete(k).catch(function(){}) })
                }).catch(function(){})
              }
            })();
          ` }} />
        )}
      </body>
    </html>
  )
}


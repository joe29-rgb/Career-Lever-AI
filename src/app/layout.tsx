import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppShell } from '@/components/app-shell'
import { initSentry } from '@/lib/sentry'
import { TopNav } from '@/components/top-nav'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className + ' bg-background text-foreground min-h-screen'}>
        <meta name="mobile-web-app-capable" content="yes" />
        <Providers>
          <a href="#main" className="skip-link">Skip to content</a>
          <TopNav />
          <div aria-live="polite" aria-atomic="true" className="sr-only" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <AppShell>{children}</AppShell>
          </div>
        </Providers>
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


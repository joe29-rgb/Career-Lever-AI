import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { ClientInit } from '@/components/client-init'
import { AppShell } from '@/components/app-shell'
import { initSentry } from '@/lib/sentry'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from 'react-hot-toast'
import { OnboardingRedirect } from '@/components/onboarding/OnboardingRedirect'
import { CommandPalette } from '@/components/command-palette'

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
      <body className="font-sans bg-background text-foreground min-h-screen" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        <script dangerouslySetInnerHTML={{ __html: `
          // Suppress browser extension errors
          window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('message channel closed')) {
              e.preventDefault();
              return true;
            }
          });
          window.addEventListener('unhandledrejection', function(e) {
            if (e.reason && e.reason.message && e.reason.message.includes('message channel closed')) {
              e.preventDefault();
              return true;
            }
          });
          // Theme init
          try{(${function(){
            if(typeof window!=='undefined'){window.__initTheme||(window.__initTheme=true,document.documentElement.style.setProperty('--theme-transition','opacity 0.3s ease'),document.documentElement.classList.add('theme-anim'))}
          }.toString()})()}catch(e){}
        ` }} />
        <ClientInit />
        <meta name="mobile-web-app-capable" content="yes" />
        <ErrorBoundary>
          <Providers>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
            <OnboardingRedirect />
            <CommandPalette />
            <AppShell>{children}</AppShell>
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


import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { initSentry } from '@/lib/sentry'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Career Lever AI - AI-Powered Job Application Assistant',
  description: 'Customize your resume and cover letters with AI to land your dream job. Get company insights, track applications, and boost your career success.',
  keywords: 'resume, job application, AI, career, recruitment, cover letter',
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
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        {/* iOS PWA meta tags */}
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Career Lever AI" />
          <link rel="apple-touch-icon" href="/icon-192.svg" />
        </head>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}` }} />
      </body>
    </html>
  )
}


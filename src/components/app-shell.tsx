'use client'

import { usePathname } from 'next/navigation'
import { UnifiedNavigation } from './unified-navigation'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isAuthPage = pathname.startsWith('/auth')
  const isLandingPage = pathname === '/'

  // Landing page: No navigation, no wrapper (hero section handles everything)
  if (isLandingPage) {
    return <>{children}</>
  }

  // Auth pages: Minimal wrapper, no navigation
  if (isAuthPage) {
    return <main id="main-content" role="main">{children}</main>
  }

  // App pages: Single navigation, no sidebar (sidebar was causing double menu)
  return (
    <div className="min-h-screen bg-background">
      {/* UNIFIED NAVIGATION - SINGLE MENU ONLY */}
      <UnifiedNavigation />
      
      {/* MAIN CONTENT - NO SIDEBAR */}
      <main id="main-content" role="main" className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}

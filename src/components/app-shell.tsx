'use client'

import { usePathname } from 'next/navigation'
import { UnifiedNavigation } from './unified-navigation'
import { Breadcrumbs } from './breadcrumbs'

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

  // App pages: Single navigation with breadcrumbs
  return (
    <div className="min-h-screen bg-background">
      {/* UNIFIED NAVIGATION */}
      <UnifiedNavigation />
      
      {/* MAIN CONTENT WITH BREADCRUMBS */}
      <main id="main-content" role="main" className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs />
        {children}
      </main>
    </div>
  )
}

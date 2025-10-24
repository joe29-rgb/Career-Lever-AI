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
      {/* UNIFIED NAVIGATION (includes sidebar) */}
      <UnifiedNavigation />
      
      {/* MAIN CONTENT WITH BREADCRUMBS - Add top padding for fixed header */}
      <main 
        id="main-content" 
        role="main" 
        className="pt-20 px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300"
        style={{ 
          marginLeft: '0', // Sidebar handles its own positioning
        }}
      >
        <div className="container mx-auto">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  )
}

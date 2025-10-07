'use client'

import { usePathname } from 'next/navigation'
import { UnifiedNavigation } from './unified-navigation'
import { EnterpriseSidebar } from '@/app/dashboard/components/enterprise-sidebar'

const DASHBOARD_PREFIXES = [
  '/dashboard',
  '/create-application',
  '/analytics',
  '/job-boards',
  '/network',
  '/resume-builder',
  '/salary-negotiation',
  '/skill-analysis',
  '/interview-prep',
  '/applications',
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const showSidebar = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    return <main id="main-content" role="main">{children}</main>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* UNIFIED NAVIGATION */}
      <UnifiedNavigation />
      
      {/* MAIN CONTENT WITH OPTIONAL SIDEBAR */}
      {showSidebar ? (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
            <EnterpriseSidebar />
            <main id="main-content" role="main" className="min-w-0">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <main id="main-content" role="main" className="container mx-auto px-4 py-6">
          {children}
        </main>
      )}
    </div>
  )
}



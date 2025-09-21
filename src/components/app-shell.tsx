'use client'

import { usePathname } from 'next/navigation'
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
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const showShell = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))

  if (!showShell) {
    return <main id="main" role="main">{children}</main>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <EnterpriseSidebar />
      <main id="main" role="main">{children}</main>
    </div>
  )
}



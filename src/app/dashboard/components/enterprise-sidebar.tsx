'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, LineChart, Layers, Wand2, Users, Settings } from 'lucide-react'

export function EnterpriseSidebar() {
  const pathname = usePathname()
  const nav = [
    { label: 'Overview', href: '/dashboard', icon: LineChart },
    { label: 'Career Finder', href: '/career-finder/resume', icon: Layers },
    { label: 'Analytics', href: '/analytics', icon: LineChart },
    { label: 'Job Boards', href: '/job-boards', icon: Briefcase },
    { label: 'Resume Builder', href: '/resume-builder', icon: Wand2 },
    { label: 'Network', href: '/network', icon: Users },
  ]

  return (
    <aside className="hidden lg:block sidebar bg-card text-card-foreground dark:bg-gray-900 dark:text-gray-100">
      <div className="nav-group">
        <div className="nav-group-title">Navigation</div>
        <nav>
          {nav.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="nav-group">
        <div className="nav-group-title">Settings</div>
        <Link href="#" className="nav-item">
          <Settings className="h-5 w-5" />
          <span className="text-sm">Preferences</span>
        </Link>
      </div>
    </aside>
  )
}



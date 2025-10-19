'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { 
  HomeIcon, 
  BriefcaseIcon, 
  DocumentTextIcon, 
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  UserIcon as UserIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  iconActive: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    iconActive: HomeIconSolid
  },
  {
    href: '/career-finder',
    label: 'Jobs',
    icon: MagnifyingGlassIcon,
    iconActive: MagnifyingGlassIconSolid
  },
  {
    href: '/applications',
    label: 'Applied',
    icon: BriefcaseIcon,
    iconActive: BriefcaseIconSolid
  },
  {
    href: '/resumes',
    label: 'Resumes',
    icon: DocumentTextIcon,
    iconActive: DocumentTextIconSolid
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: UserIcon,
    iconActive: UserIconSolid
  }
]

export function MobileNav() {
  const pathname = usePathname()

  const handleNavClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch (error) {
      // Haptics not available
      console.debug('Haptics not available')
    }
  }

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        const Icon = isActive ? item.iconActive : item.icon
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-6 h-6" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  BuildingOfficeIcon,
  UserIcon 
} from '@heroicons/react/24/outline'

const navItems = [
  { icon: HomeIcon, label: 'Home', href: '/' },
  { icon: MagnifyingGlassIcon, label: 'Search', href: '/career-finder/search' },
  { icon: DocumentTextIcon, label: 'Resume', href: '/career-finder/resume' },
  { icon: BuildingOfficeIcon, label: 'Companies', href: '/career-finder/company' },
  { icon: UserIcon, label: 'Profile', href: '/dashboard' },
]

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 z-50 shadow-2xl">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || pathname?.startsWith(href + '/')
          
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={`
                flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 min-w-0
                ${isActive 
                  ? 'bg-gradient-to-t from-blue-100 to-purple-100 text-blue-600 scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}>
                <Icon className="w-6 h-6 mb-1 flex-shrink-0" />
                <span className={`
                  text-xs font-medium truncate max-w-full
                  ${isActive ? 'font-semibold' : ''}
                `}>
                  {label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-1 shadow-sm"></div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


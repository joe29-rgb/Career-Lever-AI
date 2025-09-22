 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

type NavLink = { href: string; label: string }

const LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create-application', label: 'Applications' },
  { href: '/resume-builder', label: 'Resume' },
  { href: '/cover-letter', label: 'Cover Letter' },
  { href: '/skill-analysis', label: 'Skills' },
  { href: '/analytics', label: 'Analytics' },
]

export function TopNav() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null)

  // Close mobile menu on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Handle Escape to close, manage focus and scroll lock
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', onKeydown)
      // move focus to first link
      setTimeout(() => firstMobileLinkRef.current?.focus(), 0)
      // lock background scroll
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', onKeydown)
        document.body.style.overflow = prev
      }
    } else {
      // return focus to the menu button for keyboard users
      menuButtonRef.current?.focus()
    }
  }, [open])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav role="navigation" aria-label="Main" className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="font-semibold text-gray-900 dark:text-gray-100">CareerLever</Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`hover:underline ${isActive(link.href) ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto hidden md:flex items-center gap-3">
          <ThemeToggle />
          <div className="text-xs text-gray-500 dark:text-gray-400">AI job assistant</div>
        </div>

        {/* Mobile controls */}
        <div className="ml-auto md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            ref={menuButtonRef}
            className="p-2 rounded border text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-200 overflow-hidden ${open ? 'max-h-[420px] border-t' : 'max-h-0'} bg-white/95 dark:bg-gray-900/95`}
        role="region"
        aria-label="Mobile menu"
      >
        <div className="px-4 py-3 grid gap-2 text-sm">
          {LINKS.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              ref={idx === 0 ? firstMobileLinkRef : undefined}
              className={`block px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${isActive(link.href) ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}



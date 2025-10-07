 'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  const togglingRef = useRef(false)

  // Close mobile menu on route change (debounced to avoid flicker)
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => setOpen(false), 50)
    return () => clearTimeout(id)
  }, [pathname])

  // Handle Escape to close, manage focus and scroll lock
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      if (togglingRef.current) return
      togglingRef.current = true
      document.addEventListener('keydown', onKeydown)
      // move focus to first link
      setTimeout(() => firstMobileLinkRef.current?.focus(), 0)
      // lock background scroll
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', onKeydown)
        document.body.style.overflow = prev
        togglingRef.current = false
      }
    } else {
      // return focus to the menu button for keyboard users
      menuButtonRef.current?.focus()
    }
  }, [open])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav role="navigation" aria-label="Main" className="sticky top-0 z-[100] bg-card/95 backdrop-blur-xl border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        {/* Logo with image */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/images/careerlever-logo.png"
              alt="Career Lever"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-xl text-foreground hidden sm:block">
            Career Lever
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive(link.href) 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto hidden md:flex items-center gap-3">
          <ThemeToggle />
          <div className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-muted">
            ✨ AI Assistant
          </div>
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
            className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-300 overflow-hidden ${open ? 'max-h-[500px] border-t border-border' : 'max-h-0'} bg-card`}
        role="region"
        aria-label="Mobile menu"
      >
        <div className="px-4 py-4 grid gap-2">
          {LINKS.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              ref={idx === 0 ? firstMobileLinkRef : undefined}
              className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                isActive(link.href) 
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' 
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}



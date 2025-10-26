'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useNotifications } from '@/hooks/use-notifications'
import {
  Home,
  FileText,
  Briefcase,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Bell,
  Mail,
  BarChart3,
  Target,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  submenu?: { name: string; href: string; badge?: number }[]
}

// Enhanced Navigation Structure with Better Organization
const navigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home
  },
  {
    name: 'Career Finder',
    icon: Target,
    submenu: [
      { name: 'Job Search', href: '/career-finder/search' },
      { name: 'Job Analysis', href: '/career-finder/job-analysis' },
      { name: 'Company Research', href: '/career-finder/company' },
      { name: 'Resume Optimizer', href: '/career-finder/optimizer' },
      { name: 'Cover Letter', href: '/career-finder/cover-letter' },
      { name: 'Outreach', href: '/career-finder/outreach' }
    ]
  },
  { 
    name: 'Resume', 
    href: '/resume-builder', 
    icon: FileText 
  },
  { 
    name: 'Applications', 
    href: '/career-finder/applications', 
    icon: Briefcase
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3 
  },
  { 
    name: 'Network', 
    href: '/network', 
    icon: Users 
  },
  {
    name: 'Settings',
    icon: Settings,
    submenu: [
      { name: 'Profile', href: '/settings/profile' },
      { name: 'Preferences', href: '/settings/preferences' },
      { name: 'Alerts', href: '/settings/alerts' },
      { name: 'Privacy', href: '/settings/privacy' },
      { name: 'Integrations', href: '/settings/integrations' },
      { name: 'Job Boards', href: '/settings/job-boards' }
    ]
  },
]

export function UnifiedNavigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true) // Desktop sidebar state
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect screen size and auto-adjust sidebar
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      const wasMobile = isMobile
      
      setIsMobile(mobile)
      
      // Auto-collapse on mobile, auto-open on desktop
      if (mobile && !wasMobile) {
        setSidebarOpen(false) // Switched to mobile - close sidebar
      } else if (!mobile && wasMobile) {
        setSidebarOpen(true) // Switched to desktop - open sidebar
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [isMobile])
  const [scrolled, setScrolled] = useState(false)
  const { count: notificationCount } = useNotifications()

  // Handle scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        window.location.href = '/career-finder/search'
      }
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(!sidebarOpen)
      }
      // Escape to close mobile menu
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, sidebarOpen])
  
  // Only show navigation when user is signed in (not on landing or auth pages)
  const isAuthPage = pathname?.startsWith('/auth')
  const isLandingPage = pathname === '/'
  
  // Show loading skeleton while session is loading
  if (status === 'loading') {
    return (
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-xl" style={{ height: '64px', zIndex: 1000 }}>
        <div className="h-full px-4 flex items-center justify-between">
          <div className="w-32 h-8 bg-muted animate-pulse rounded"></div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
            <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    )
  }
  
  // Hide navigation if: on auth pages, on landing page, or not authenticated
  if (isAuthPage || isLandingPage || status === 'unauthenticated') return null

  const isItemActive = (item: NavigationItem) => {
    if (item.href && pathname === item.href) return true
    if (item.submenu) {
      return item.submenu.some(sub => pathname === sub.href || pathname?.startsWith(sub.href))
    }
    return false
  }

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenu(expandedMenu === itemName ? null : itemName)
  }

  return (
    <>
      {/* TOP BAR - Minimal, just logo and actions */}
      <header 
        className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
          scrolled 
            ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-xl' 
            : 'bg-background/90 backdrop-blur-lg border-b border-border/50 shadow-md'
        }`}
        style={{ height: '64px', zIndex: 1000 }}
      >
        <div className="h-full px-4 flex items-center justify-between">
          {/* LEFT: Sidebar toggle + Logo */}
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 rounded-lg hover:bg-accent/50 transition-all"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeft className="w-5 h-5" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent/50 transition-all"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Logo */}
            <Link 
              href={session ? '/dashboard' : '/'} 
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                CL
              </div>
              <span className="gradient-text font-bold text-lg hidden sm:inline-block">
                Career Lever AI
              </span>
            </Link>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Link
              href="/career-finder/search"
              className="hidden sm:flex p-2 rounded-lg hover:bg-accent/50 transition-all"
              title="Search Jobs (⌘K)"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-accent/50 transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>

            {/* Theme Toggle */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* User Menu */}
            {session && (
              <div className="hidden md:block relative group">
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/50 transition-all">
                  <Avatar className="h-8 w-8 ring-2 ring-border/50">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-semibold">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Overlay on mobile, fixed on desktop */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 overflow-y-auto ${
          isMobile 
            ? `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-50 w-64`
            : `${sidebarOpen ? 'w-64' : 'w-0'} z-10`
        }`}
      >
        <div className={`p-4 space-y-2 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item)
            const hasSubmenu = item.submenu && item.submenu.length > 0
            
            return (
              <div key={item.name}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary'
                          : 'text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        expandedMenu === item.name ? 'rotate-90' : ''
                      }`} />
                    </button>
                    
                    {expandedMenu === item.name && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all ${
                              pathname === subItem.href
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                            }`}
                          >
                            <span>{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary'
                        : 'text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* MOBILE NAVIGATION PANEL */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-xl z-50 overflow-y-auto">
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item)
              const hasSubmenu = item.submenu && item.submenu.length > 0
              
              return (
                <div key={item.name}>
                  {hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary'
                            : 'text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          expandedMenu === item.name ? 'rotate-90' : ''
                        }`} />
                      </button>
                      
                      {expandedMenu === item.name && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all ${
                                pathname === subItem.href
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                              }`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span>{subItem.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary'
                          : 'text-foreground hover:bg-accent/50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </div>
              )
            })}
            
            {/* Mobile Footer */}
            <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
              <ThemeToggle />
              {session && (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

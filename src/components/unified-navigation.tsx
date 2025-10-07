'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Menu, 
  X, 
  Home, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  Settings,
  User,
  LogOut,
  Search,
  Users,
  ChevronDown,
  Bell,
  MessageSquare
} from 'lucide-react'

interface NavigationItem {
  name: string
  href?: string
  icon: any
  badge?: number
  submenu?: { name: string; href: string; badge?: number }[]
}

// Dribbble-Quality Navigation Structure
const navigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    badge: 0
  },
  {
    name: 'Career Finder',
    icon: Search,
    submenu: [
      { name: 'Job Search', href: '/career-finder/search' },
      { name: 'Resume Analysis', href: '/career-finder/resume' },
      { name: 'Cover Letter', href: '/cover-letter' }
    ]
  },
  { 
    name: 'Applications', 
    href: '/create-application', 
    icon: Briefcase,
    badge: 0
  },
  { 
    name: 'Resume Builder', 
    href: '/resume-builder', 
    icon: FileText 
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: TrendingUp 
  },
  { 
    name: 'Network', 
    href: '/network', 
    icon: Users,
    badge: 0
  },
]

export function UnifiedNavigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  
  // Don't show navigation on auth or landing pages
  const isAuthPage = pathname?.startsWith('/auth')
  const isLandingPage = pathname === '/'
  
  if (isAuthPage || isLandingPage) return null

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
    setExpandedMenu(null)
  }, [pathname])

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
    <header 
      className={`sticky top-0 z-navigation transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' 
          : 'bg-background/60 backdrop-blur-md border-b border-border/30'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LOGO WITH GRADIENT */}
          <Link 
            href={session ? '/dashboard' : '/'} 
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              CL
            </div>
            <span className="gradient-text font-bold text-xl hidden sm:inline">
              Career Lever AI
            </span>
          </Link>

          {/* DESKTOP NAVIGATION WITH DRIBBBLE STYLE */}
          {session && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = isItemActive(item)
                const hasSubmenu = item.submenu && item.submenu.length > 0
                
                return (
                  <div key={item.name} className="relative group">
                    {hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${
                            expandedMenu === item.name ? 'rotate-180' : ''
                          }`} />
                          {item.badge && item.badge > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-sm">
                              {item.badge}
                            </span>
                          )}
                        </button>
                        
                        {/* SUBMENU DROPDOWN */}
                        {expandedMenu === item.name && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-dropdown">
                            {item.submenu?.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-200 ${
                                  pathname === subItem.href
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground hover:bg-accent/50'
                                }`}
                              >
                                <span>{subItem.name}</span>
                                {subItem.badge && subItem.badge > 0 && (
                                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-105'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-1 px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                )
              })}
            </nav>
          )}

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center space-x-3">
            {/* NOTIFICATIONS ICON */}
            {session && (
              <button className="hidden md:flex relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300 hover:scale-105">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
              </button>
            )}

            {/* THEME TOGGLE */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* USER MENU OR AUTH BUTTONS */}
            {session ? (
              <div className="flex items-center space-x-2">
                {/* USER DROPDOWN */}
                <div className="hidden md:block relative group">
                  <button className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-accent/50 transition-all duration-300">
                    <Avatar className="h-8 w-8 ring-2 ring-border/50 hover:ring-primary/50 transition-all">
                      <AvatarImage src={session.user?.image || ''} />
                      <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">
                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold hidden xl:inline">{session.user?.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {/* USER DROPDOWN MENU */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-dropdown">
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/settings/profile"
                      className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {/* MOBILE MENU BUTTON */}
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-accent/50 transition-all"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="rounded-xl">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild className="rounded-xl bg-gradient-primary text-white hover:opacity-90">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE NAVIGATION PANEL - DRIBBBLE STYLE */}
        {session && mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-border/50">
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
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span>{item.name}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          expandedMenu === item.name ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedMenu === item.name && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                pathname === subItem.href
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                              }`}
                            >
                              <span>{subItem.name}</span>
                              {subItem.badge && subItem.badge > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                                  {subItem.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary'
                          : 'text-foreground hover:bg-accent/50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              )
            })}
            
            {/* MOBILE FOOTER ACTIONS */}
            <div className="pt-4 mt-4 border-t border-border/50 space-y-1">
              <ThemeToggle />
              <Link
                href="/settings"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-accent/50 transition-all"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

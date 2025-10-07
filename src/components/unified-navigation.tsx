'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
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
  Target
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Applications', href: '/create-application', icon: Briefcase },
  { name: 'Resume Builder', href: '/resume-builder', icon: FileText },
  { name: 'Career Finder', href: '/career-finder/search', icon: Search },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
]

export function UnifiedNavigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Don't show navigation on auth pages
  const isAuthPage = pathname?.startsWith('/auth')
  const isHomePage = pathname === '/'
  
  if (isAuthPage) return null

  return (
    <header className="nav-container">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link 
            href={session ? '/dashboard' : '/'} 
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold">
              CL
            </div>
            <span className="gradient-text hidden sm:inline">Career Lever AI</span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          {session && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center space-x-3">
            {/* THEME TOGGLE */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* USER MENU OR AUTH BUTTONS */}
            {session ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/settings"
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-gradient text-sm px-4 py-2"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* MOBILE MENU BUTTON */}
            {session && (
              <button
                className="md:hidden p-2 hover:bg-accent/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {session && mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-border/50">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <div className="pt-2 border-t border-border/50 space-y-1">
              <Link
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <div className="px-3 py-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { ThemeManager, ThemeMode } from '@/lib/theme-manager'

export function ThemeToggle({ className, fixed = false }: { className?: string; fixed?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    ThemeManager.init()
    const current = document.documentElement.getAttribute('data-theme') as ThemeMode | null
    if (current === 'dark' || current === 'light') setMode(current)
  }, [])

  const handleThemeChange = () => {
    const next = ThemeManager.toggle()
    setMode(next)
  }

  const containerClass = fixed ? 'theme-toggle-fixed' : 'relative z-theme-toggle'

  return (
    <div className={`${containerClass} ${className || ''}`}>
      <button
        aria-label="Toggle theme"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-xl border border-border/50 hover:bg-accent/80 transition-all duration-200 text-sm font-medium"
        onClick={handleThemeChange}
      >
        {mode === 'dark' ? (
          <>
            <span className="text-lg">☀️</span>
            <span className="hidden sm:inline">Light</span>
          </>
        ) : (
          <>
            <span className="text-lg">🌙</span>
            <span className="hidden sm:inline">Dark</span>
          </>
        )}
      </button>
    </div>
  )
}



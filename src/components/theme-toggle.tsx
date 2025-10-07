'use client'

import { useEffect, useState } from 'react'
import { ThemeManager, ThemeMode } from '@/lib/theme-manager'

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    ThemeManager.init()
    const current = document.documentElement.getAttribute('data-theme') as ThemeMode | null
    if (current === 'dark' || current === 'light') setMode(current)
  }, [])

  const onToggle = () => {
    const next = ThemeManager.toggle()
    setMode(next)
  }

  return (
    <button
      aria-label="Toggle theme"
      className="btn btn-ghost btn-desktop fixed top-3 right-3 z-50"
      onClick={onToggle}
    >
      <span aria-hidden>{mode === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  )
}



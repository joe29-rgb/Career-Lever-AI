'use client'

import { useEffect, useState } from 'react'
import { ThemeManager, ThemeMode } from '@/lib/theme-manager'

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    ThemeManager.init()
    // read applied theme
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

'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('theme')
      const isDark = saved === 'dark'
      setDark(isDark)
      if (isDark) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    } catch {}
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  if (!mounted) return null
  return (
    <button type="button" onClick={toggle} aria-label="Toggle dark mode" className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}



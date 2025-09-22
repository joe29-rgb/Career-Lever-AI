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



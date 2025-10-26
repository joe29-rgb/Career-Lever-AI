'use client'

export type ThemeMode = 'light' | 'dark'

export class ThemeManager {
  private static current: ThemeMode | null = null
  private static storageKey = 'theme'

  static init() {
    try {
      const stored = this.getStoredTheme()
      const system = this.getSystemTheme()
      // Default to dark theme if no preference stored
      const theme: ThemeMode = stored || 'dark'
      this.applyTheme(theme, false)
      // listen for system changes when user hasn't stored a preference
      if (!stored && typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => {
          const next = mq.matches ? 'dark' : 'light'
          this.applyTheme(next, true)
        }
        try { mq.addEventListener('change', handler) } catch { mq.addListener(handler) }
      }
    } catch {}
  }

  static toggle(): ThemeMode {
    const next: ThemeMode = this.current === 'dark' ? 'light' : 'dark'
    this.applyTheme(next, true)
    this.persist(next)
    return next
  }

  static set(theme: ThemeMode) {
    this.applyTheme(theme, true)
    this.persist(theme)
  }

  private static getStoredTheme(): ThemeMode | null {
    try {
      const v = localStorage.getItem(this.storageKey)
      if (v === 'light' || v === 'dark') return v
    } catch {}
    return null
  }

  private static getSystemTheme(): ThemeMode {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  private static persist(theme: ThemeMode) {
    try { localStorage.setItem(this.storageKey, theme) } catch {}
  }

  private static applyTheme(theme: ThemeMode, animate: boolean) {
    try {
      const root = document.documentElement
      if (animate) {
        root.classList.add('theme-anim')
        setTimeout(() => root.classList.remove('theme-anim'), 350)
      }
      root.setAttribute('data-theme', theme)
      this.current = theme
    } catch {}
  }
}



'use client'

export class DeviceManager {
  private static resizeHandler: (() => void) | null = null

  static init() {
    this.apply()
    if (typeof window !== 'undefined') {
      const apply = () => this.apply()
      this.resizeHandler = apply
      window.addEventListener('resize', apply, { passive: true })
      window.addEventListener('orientationchange', apply, { passive: true })
    }
  }

  static dispose() {
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler as any)
      window.removeEventListener('orientationchange', this.resizeHandler as any)
    }
  }

  private static apply() {
    try {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024
      const body = document.body
      body.classList.remove('mobile-device','tablet-device','desktop-device','no-hover','has-hover')
      if (w < 768) body.classList.add('mobile-device')
      else if (w < 1024) body.classList.add('tablet-device')
      else body.classList.add('desktop-device')
      const supportsHover = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches
      body.classList.add(supportsHover ? 'has-hover' : 'no-hover')
    } catch {}
  }
}



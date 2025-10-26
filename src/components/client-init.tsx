'use client'

import { useEffect } from 'react'
import { ThemeManager } from '@/lib/theme-manager'
import { DeviceManager } from '@/lib/device-manager'

export function ClientInit() {
  useEffect(() => {
    try { ThemeManager.init() } catch {}
    try { DeviceManager.init() } catch {}
    return () => {
      try { DeviceManager.dispose() } catch {}
    }
  }, [])
  return null
}



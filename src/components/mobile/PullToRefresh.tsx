'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import confetti from 'canvas-confetti'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
  disabled?: boolean
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80,
  disabled = false 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const triggerHaptic = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch (error) {
      console.debug('Haptics not available')
    }
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.1 }
    })
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, threshold * 1.5))
      setIsPulling(distance > threshold)
      
      // Haptic feedback when reaching threshold
      if (distance > threshold && !isPulling) {
        triggerHaptic()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return
    
    if (isPulling && pullDistance > threshold) {
      setIsRefreshing(true)
      await triggerHaptic()
      
      try {
        await onRefresh()
        triggerConfetti()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setIsPulling(false)
    setPullDistance(0)
    startY.current = 0
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, isRefreshing, disabled])

  const pullProgress = Math.min((pullDistance / threshold) * 100, 100)

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="pull-to-refresh"
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          opacity: pullDistance > 0 ? 1 : 0
        }}
      >
        {isRefreshing ? (
          <div className="pull-to-refresh-spinner" />
        ) : (
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Progress circle */}
            <svg className="absolute w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#667eea"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - pullProgress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.1s ease' }}
              />
            </svg>
            {/* Arrow icon */}
            <div
              className="text-2xl transition-transform duration-200"
              style={{
                transform: isPulling ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              ↓
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance * 0.5, threshold * 0.5)}px)`,
          transition: isPulling || isRefreshing ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  )
}

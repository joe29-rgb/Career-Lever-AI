'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

interface SuccessAnimationProps {
  title?: string
  message?: string
  onComplete?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function SuccessAnimation({
  title = 'Success!',
  message = 'Action completed successfully',
  onComplete,
  autoClose = true,
  autoCloseDelay = 2000
}: SuccessAnimationProps) {
  
  useEffect(() => {
    // Trigger haptic feedback
    const triggerHaptics = async () => {
      try {
        // Success notification haptic
        await Haptics.notification({ type: NotificationType.Success })
      } catch (error) {
        console.debug('Haptics not available')
      }
    }

    // Fire confetti
    const fireConfetti = () => {
      const duration = 2000
      const animationEnd = Date.now() + duration
      const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 10000,
        colors: ['#667eea', '#764ba2', '#10b981', '#f59e0b']
      }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        const particleCount = 30 * (timeLeft / duration)
        
        // Fire from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        
        // Fire from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }

    triggerHaptics()
    const cleanup = fireConfetti()

    // Auto-close
    if (autoClose && onComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, autoCloseDelay)

      return () => {
        cleanup()
        clearTimeout(timer)
      }
    }

    return cleanup
  }, [autoClose, autoCloseDelay, onComplete])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 20 
        }}
        className="bg-card rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.2, 
            type: 'spring', 
            stiffness: 200, 
            damping: 15 
          }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2"
        >
          {title}
        </motion.h2>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 dark:text-gray-400"
        >
          {message}
        </motion.p>

        {/* Progress indicator (if auto-close) */}
        {autoClose && (
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: autoCloseDelay / 1000, ease: 'linear' }}
            className="h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mt-6"
          />
        )}
      </motion.div>
    </div>
  )
}

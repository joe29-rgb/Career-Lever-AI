'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface JobCardProps {
  job: {
    id: string
    title: string
    company: string
    location: string
    salary?: string
    type: string
    postedDate: string
    description: string
  }
  onSwipeLeft?: (jobId: string) => void
  onSwipeRight?: (jobId: string) => void
  onTap?: (jobId: string) => void
}

export function JobCard({ job, onSwipeLeft, onSwipeRight, onTap }: JobCardProps) {
  const [isExiting, setIsExiting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  
  // Transform x position to rotation
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  
  // Transform x position to opacity for indicators
  const leftOpacity = useTransform(x, [-200, -50, 0], [1, 0.5, 0])
  const rightOpacity = useTransform(x, [0, 50, 200], [0, 0.5, 1])

  // Trigger haptic feedback
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style })
    } catch (error) {
      // Haptics not available (web browser)
      console.debug('Haptics not available')
    }
  }

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    
    if (Math.abs(info.offset.x) > threshold) {
      setIsExiting(true)
      
      // Trigger strong haptic feedback
      await triggerHaptic(ImpactStyle.Medium)
      
      if (info.offset.x > 0) {
        // Swiped right (like/save)
        onSwipeRight?.(job.id)
      } else {
        // Swiped left (dismiss)
        onSwipeLeft?.(job.id)
      }
    } else {
      // Snap back to center
      await triggerHaptic(ImpactStyle.Light)
    }
  }

  const handleTap = async () => {
    await triggerHaptic(ImpactStyle.Light)
    onTap?.(job.id)
  }

  return (
    <motion.div
      ref={cardRef}
      className="swipeable-card ripple"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      animate={isExiting ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Swipe indicators */}
      <motion.div
        className="swipe-indicator swipe-indicator-left"
        style={{ opacity: leftOpacity }}
      >
        ❌
      </motion.div>
      
      <motion.div
        className="swipe-indicator swipe-indicator-right"
        style={{ opacity: rightOpacity }}
      >
        ⭐
      </motion.div>

      {/* Card content */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {job.title}
            </h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {job.company}
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {job.company.charAt(0)}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
            📍 {job.location}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
            💼 {job.type}
          </span>
          {job.salary && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              💰 {job.salary}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {job.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Posted {job.postedDate}
          </span>
          <div className="flex gap-2">
            <button
              className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center ripple"
              onClick={(e) => {
                e.stopPropagation()
                triggerHaptic(ImpactStyle.Light)
                onSwipeLeft?.(job.id)
              }}
              aria-label="Dismiss job"
            >
              ✕
            </button>
            <button
              className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center ripple"
              onClick={(e) => {
                e.stopPropagation()
                triggerHaptic(ImpactStyle.Light)
                onSwipeRight?.(job.id)
              }}
              aria-label="Save job"
            >
              ⭐
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

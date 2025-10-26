'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface QuizQuestionProps {
  title: string
  subtitle?: string
  children: ReactNode
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  showBack?: boolean
}

export function QuizQuestion({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled = false,
  showBack = true
}: QuizQuestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-[calc(100vh-80px)] px-4 py-6"
    >
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Question Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {/* Question Content */}
        <div className="flex-1 mb-6">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-card border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all min-h-[44px]"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl min-h-[44px]"
          >
            {nextLabel} →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

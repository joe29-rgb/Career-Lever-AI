'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { QuizQuestion } from '@/components/onboarding/QuizQuestion'
import { SuccessAnimation } from '@/components/onboarding/SuccessAnimation'
import './styles.css'
import {
  QuizAnswers,
  CurrentSituation,
  WorkPreference,
  Timeline,
  COMMON_JOB_TITLES,
  getExperienceLevelLabel,
  saveQuizProgress,
  loadQuizProgress,
  clearQuizProgress,
  calculateUrgency
} from '@/lib/onboarding-utils'

const TOTAL_STEPS = 5

export default function OnboardingQuizPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Quiz answers
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    workPreferences: [],
    preferredLocation: '',
    yearsOfExperience: 5
  })

  // Autocomplete state
  const [roleSearch, setRoleSearch] = useState('')
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([])

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadQuizProgress()
    if (saved) {
      setAnswers(saved.answers)
      setCurrentStep(saved.currentStep)
      if (saved.answers.targetRole) {
        setRoleSearch(saved.answers.targetRole)
      }
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/onboarding/quiz')
    }
  }, [status, router])

  // Auto-save progress
  useEffect(() => {
    if (currentStep > 1) {
      saveQuizProgress(answers, currentStep)
    }
  }, [answers, currentStep])

  // Handle role search
  useEffect(() => {
    if (roleSearch.length >= 2) {
      const filtered = COMMON_JOB_TITLES.filter(title =>
        title.toLowerCase().includes(roleSearch.toLowerCase())
      ).slice(0, 8)
      setRoleSuggestions(filtered)
    } else {
      setRoleSuggestions([])
    }
  }, [roleSearch])

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    
    try {
      // Calculate urgency
      const urgency = calculateUrgency(
        answers.currentSituation!,
        answers.timeline
      )

      const response = await fetch('/api/onboarding/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          urgency,
          completedAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save quiz answers')
      }

      // Clear saved progress
      clearQuizProgress()

      // Update session to reflect onboarding completion
      await update()

      // Show success animation
      setShowSuccess(true)
    } catch (error) {
      console.error('[ONBOARDING] Failed to save quiz:', error)
      alert('Failed to save your answers. Please try again.')
      setSaving(false)
    }
  }

  const handleSuccessComplete = () => {
    router.push('/career-finder/resume')
  }

  // Check if current step is complete
  const isStepComplete = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!answers.currentSituation
      case 2:
        return answers.yearsOfExperience !== undefined
      case 3:
        return !!answers.targetRole && answers.targetRole.length >= 2
      case 4:
        return answers.workPreferences!.length > 0
      case 5:
        // Timeline only required for actively searching or career change
        if (answers.currentSituation === 'actively_searching' || answers.currentSituation === 'career_change') {
          return !!answers.timeline
        }
        return true
      default:
        return false
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (showSuccess) {
    return <SuccessAnimation onComplete={handleSuccessComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Question 1: Current Situation */}
      {currentStep === 1 && (
        <QuizQuestion
          title="What's your current situation?"
          subtitle="This helps us understand your job search urgency"
          onNext={handleNext}
          showBack={false}
          nextDisabled={!isStepComplete()}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'actively_searching', icon: '🔍', label: 'Actively job searching', desc: 'I need a job soon' },
              { value: 'open_to_offers', icon: '👀', label: 'Open to new opportunities', desc: 'Exploring options' },
              { value: 'employed_not_looking', icon: '💼', label: 'Employed, not looking', desc: 'Just browsing' },
              { value: 'student', icon: '🎓', label: 'Student/Recent graduate', desc: 'Starting my career' },
              { value: 'career_change', icon: '🚀', label: 'Career change', desc: 'Switching industries' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setAnswers({ ...answers, currentSituation: option.value as CurrentSituation })}
                className={`p-4 rounded-xl border-2 text-left transition-all min-h-[80px] ${
                  answers.currentSituation === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.desc}
                    </div>
                  </div>
                  {answers.currentSituation === option.value && (
                    <span className="text-blue-500 text-xl">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </QuizQuestion>
      )}

      {/* Question 2: Years of Experience */}
      {currentStep === 2 && (
        <QuizQuestion
          title="How many years of experience do you have?"
          subtitle="This helps us match you with the right seniority level"
          onNext={handleNext}
          onBack={handleBack}
          nextDisabled={!isStepComplete()}
        >
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {answers.yearsOfExperience}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  {getExperienceLevelLabel(answers.yearsOfExperience || 0)}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="30"
                value={answers.yearsOfExperience || 5}
                onChange={(e) => setAnswers({ ...answers, yearsOfExperience: parseInt(e.target.value) })}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>30+</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  {answers.yearsOfExperience === 0 && "You're early in your career - we'll focus on entry-level opportunities"}
                  {answers.yearsOfExperience! >= 1 && answers.yearsOfExperience! <= 2 && "You have some experience - we'll target junior to mid-level roles"}
                  {answers.yearsOfExperience! >= 3 && answers.yearsOfExperience! <= 5 && "You're a mid-level professional - we'll find senior opportunities"}
                  {answers.yearsOfExperience! >= 6 && answers.yearsOfExperience! <= 10 && "You're an experienced professional - we'll target senior and lead roles"}
                  {answers.yearsOfExperience! > 10 && "You're a seasoned professional - we'll focus on leadership and executive positions"}
                </div>
              </div>
            </div>
          </div>
        </QuizQuestion>
      )}

      {/* Question 3: Target Role */}
      {currentStep === 3 && (
        <QuizQuestion
          title="What type of role are you targeting?"
          subtitle="Be specific to get better matches"
          onNext={handleNext}
          onBack={handleBack}
          nextDisabled={!isStepComplete()}
        >
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => {
                  setRoleSearch(e.target.value)
                  setAnswers({ ...answers, targetRole: e.target.value })
                }}
                placeholder="e.g., Sales Manager, Software Engineer, Marketing Director"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
              />
              {roleSearch && (
                <button
                  onClick={() => {
                    setRoleSearch('')
                    setAnswers({ ...answers, targetRole: '' })
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions */}
            {roleSuggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Suggestions:</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {roleSuggestions.map(title => (
                    <button
                      key={title}
                      onClick={() => {
                        setRoleSearch(title)
                        setAnswers({ ...answers, targetRole: title })
                        setRoleSuggestions([])
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <span className="text-gray-900 dark:text-white">{title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular roles */}
            {!roleSearch && (
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Popular roles:</div>
                <div className="flex flex-wrap gap-2">
                  {['Software Engineer', 'Product Manager', 'Sales Manager', 'Marketing Manager', 'Data Analyst', 'UX Designer'].map(title => (
                    <button
                      key={title}
                      onClick={() => {
                        setRoleSearch(title)
                        setAnswers({ ...answers, targetRole: title })
                      }}
                      className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </QuizQuestion>
      )}

      {/* Question 4: Work Preferences */}
      {currentStep === 4 && (
        <QuizQuestion
          title="Where do you want to work?"
          subtitle="Select all that apply"
          onNext={handleNext}
          onBack={handleBack}
          nextDisabled={!isStepComplete()}
        >
          <div className="space-y-6">
            {/* Work preference chips */}
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Work arrangement:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'remote', icon: '🏡', label: 'Remote', desc: 'Work from anywhere' },
                  { value: 'onsite', icon: '🏢', label: 'On-site', desc: 'In the office' },
                  { value: 'hybrid', icon: '🔄', label: 'Hybrid', desc: 'Mix of both' }
                ].map(option => {
                  const isSelected = answers.workPreferences?.includes(option.value as WorkPreference)
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const current = answers.workPreferences || []
                        const updated = isSelected
                          ? current.filter(p => p !== option.value)
                          : [...current, option.value as WorkPreference]
                        setAnswers({ ...answers, workPreferences: updated })
                      }}
                      className={`p-4 rounded-xl border-2 text-center transition-all min-h-[100px] ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {option.desc}
                      </div>
                      {isSelected && (
                        <div className="mt-2 text-blue-500 text-xl">✓</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Location input */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Preferred city/region (optional):
              </label>
              <input
                type="text"
                value={answers.preferredLocation || ''}
                onChange={(e) => setAnswers({ ...answers, preferredLocation: e.target.value })}
                placeholder="e.g., Edmonton, AB or New York, NY"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Leave blank if you selected "Remote" only
              </p>
            </div>
          </div>
        </QuizQuestion>
      )}

      {/* Question 5: Timeline (conditional) */}
      {currentStep === 5 && (
        <QuizQuestion
          title="What's your timeline?"
          subtitle={
            answers.currentSituation === 'actively_searching' || answers.currentSituation === 'career_change'
              ? 'When do you need a new job?'
              : 'This helps us prioritize opportunities'
          }
          onNext={handleNext}
          onBack={handleBack}
          nextDisabled={!isStepComplete()}
          nextLabel={saving ? 'Saving...' : 'Complete Profile'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'asap', icon: '⚡', label: 'ASAP (within 2 weeks)', desc: 'I need a job urgently' },
              { value: '1-3_months', icon: '📅', label: '1-3 months', desc: 'Actively searching' },
              { value: '3-6_months', icon: '🗓️', label: '3-6 months', desc: 'Planning ahead' },
              { value: 'flexible', icon: '🕐', label: 'Flexible', desc: 'No rush' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setAnswers({ ...answers, timeline: option.value as Timeline })}
                className={`p-4 rounded-xl border-2 text-left transition-all min-h-[80px] ${
                  answers.timeline === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.desc}
                    </div>
                  </div>
                  {answers.timeline === option.value && (
                    <span className="text-blue-500 text-xl">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </QuizQuestion>
      )}
    </div>
  )
}

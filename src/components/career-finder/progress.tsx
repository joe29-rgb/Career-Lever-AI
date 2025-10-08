'use client'

import { usePathname } from 'next/navigation'

const steps = [
  { key: 'resume', label: 'Resume', icon: '📝' },
  { key: 'search', label: 'Search', icon: '🔍' },
  { key: 'job', label: 'Analysis', icon: '📊' },
  { key: 'company', label: 'Insights', icon: '🏢' },
  { key: 'optimizer', label: 'Optimize', icon: '✨' },
  { key: 'cover-letter', label: 'Letter', icon: '✉️' },
  { key: 'outreach', label: 'Outreach', icon: '🚀' },
]

export function CareerFinderProgress() {
  const pathname = usePathname()
  // Derive index from path or persisted localStorage
  let idx = Math.max(0, steps.findIndex(s => pathname?.includes(`/career-finder/${s.key}`)))
  try {
    const persisted = JSON.parse(localStorage.getItem('cf:progress') || 'null')
    if (persisted && typeof persisted.step === 'number') {
      idx = Math.max(idx, Math.min(steps.length - 1, (persisted.step - 1)))
    }
  } catch {}
  const percent = Math.round(((idx + 1) / steps.length) * 100)

  return (
    <div className="w-full mb-8 px-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-col items-center min-w-[80px] relative">
            {/* Step Circle */}
            <div className="relative">
              {/* Moving Loader (only on current step) */}
              {i === idx && (
                <div 
                  className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-[#5424FD] border-r-[#8B5CF6]"
                  style={{
                    animation: 'spin 1.5s linear infinite',
                  }}
                />
              )}
              
              {/* Step Icon */}
              <div 
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl
                  transition-all duration-300 shadow-lg relative z-10
                  ${i <= idx 
                    ? 'bg-gradient-to-br from-[#5424FD] to-[#8B5CF6] text-white scale-110' 
                    : 'bg-muted text-muted-foreground scale-100'
                  }
                `}
              >
                {step.icon}
              </div>
            </div>
            
            {/* Step Label */}
            <span 
              className={`
                mt-2 text-xs font-medium text-center
                ${i <= idx ? 'text-foreground font-semibold' : 'text-muted-foreground'}
              `}
            >
              {step.label}
            </span>
            
            {/* Connector Line */}
            {i < steps.length - 1 && (
              <div 
                className={`
                  absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)]
                  h-1 rounded-full transition-all duration-500
                  ${i < idx 
                    ? 'bg-gradient-to-r from-[#5424FD] to-[#8B5CF6]' 
                    : 'bg-muted'
                  }
                `}
                style={{ zIndex: -1 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Modern Progress Bar */}
      <div className="relative">
        {/* Progress Text */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">
            Step {idx + 1} of {steps.length}
          </span>
          <span className="text-sm font-bold text-primary">
            {percent}%
          </span>
        </div>
        
        {/* Progress Bar Track */}
        <div className="relative w-full h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
          {/* Animated Progress Fill */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
            style={{ 
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #5424FD 0%, #8B5CF6 50%, #A78BFA 100%)',
              boxShadow: '0 0 12px rgba(84, 36, 253, 0.5)'
            }}
          >
            {/* Shine Effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: 'shine 2s infinite',
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}



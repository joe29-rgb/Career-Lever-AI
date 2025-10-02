'use client'

import { usePathname } from 'next/navigation'

const steps = [
  { key: 'resume', label: 'Resume' },
  { key: 'search', label: 'Search' },
  { key: 'job', label: 'Job Analysis' },
  { key: 'company', label: 'Company Insights' },
  { key: 'optimizer', label: 'Resume Optimizer' },
  { key: 'cover-letter', label: 'Cover Letter' },
  { key: 'outreach', label: 'Outreach' },
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
    <div className="w-full mb-4">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className={`px-2 py-1 rounded ${i <= idx ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{s.label}</div>
          ))}
        </div>
        <div>{percent}%</div>
      </div>
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-blue-600 rounded" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}



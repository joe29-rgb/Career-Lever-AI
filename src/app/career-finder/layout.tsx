import { ReactNode } from 'react'
import { CareerFinderProgress } from '@/components/career-finder/progress'

export default function CareerFinderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Career Finder</h1>
      <CareerFinderProgress />
      {children}
    </div>
  )
}



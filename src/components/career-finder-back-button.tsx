/**
 * Career Finder Back Button
 * Consistent navigation for all Career Finder pages
 */

'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CareerFinderBackButtonProps {
  label?: string
  className?: string
  onClick?: () => void
}

export function CareerFinderBackButton({ 
  label = 'Back', 
  className,
  onClick 
}: CareerFinderBackButtonProps) {
  const router = useRouter()
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group",
        className
      )}
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span className="font-medium">{label}</span>
    </button>
  )
}


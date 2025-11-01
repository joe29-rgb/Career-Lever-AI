/**
 * MOBILE MENU COMPONENT
 * Responsive hamburger menu for mobile devices
 */

'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  children: React.ReactNode
  className?: string
}

export function MobileMenu({ children, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-[60] p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-muted transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50] lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu Content */}
      <nav
        className={cn(
          'fixed top-0 right-0 h-full w-[280px] bg-card border-l border-border shadow-2xl z-[55] lg:relative lg:w-auto lg:h-auto lg:border-0 lg:shadow-none lg:bg-transparent',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="p-6 pt-20 lg:p-0 h-full overflow-y-auto">
          {children}
        </div>
      </nav>
    </>
  )
}

export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Toggle menu"
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}

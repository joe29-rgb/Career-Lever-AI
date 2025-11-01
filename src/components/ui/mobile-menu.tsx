/**
 * MOBILE MENU - Production Ready
 * Path: src/components/ui/mobile-menu.tsx
 * Hamburger menu with slide-in animation
 */

'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  items: {
    label: string
    href: string
    icon?: string
  }[]
  onClose?: () => void
  className?: string
}

export function MobileMenu({ items, onClose, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'relative w-10 h-10 flex items-center justify-center',
          'rounded-lg hover:bg-muted transition-colors',
          'lg:hidden',
          className
        )}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-5 flex flex-col justify-between relative">
          <span
            className={cn(
              'h-0.5 bg-foreground transition-all duration-300',
              isOpen && 'rotate-45 absolute top-2.5'
            )}
          />
          <span
            className={cn(
              'h-0.5 bg-foreground transition-opacity duration-300',
              isOpen && 'opacity-0'
            )}
          />
          <span
            className={cn(
              'h-0.5 bg-foreground transition-all duration-300',
              isOpen && '-rotate-45 absolute top-2.5'
            )}
          />
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-dropdown lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Menu Drawer */}
      <nav
        className={cn(
          'fixed top-0 right-0 h-screen w-64 bg-card border-l-2 border-border',
          'transform transition-transform duration-300 z-modal',
          'lg:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Menu</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col divide-y divide-border">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={cn(
                'px-4 py-4 flex items-center gap-3',
                'text-foreground hover:bg-muted transition-colors',
                'font-medium text-sm'
              )}
              onClick={handleClose}
            >
              {item.icon && <span className="text-xl">{item.icon}</span>}
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}

/**
 * MOBILE HEADER - Complete header with menu
 */
interface MobileHeaderProps {
  title?: string
  logo?: React.ReactNode
  menuItems: {
    label: string
    href: string
    icon?: string
  }[]
  actions?: React.ReactNode
}

export function MobileHeader({
  title,
  logo,
  menuItems,
  actions,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-sticky bg-card border-b-2 border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          {logo && <div>{logo}</div>}
          {title && (
            <h1 className="font-bold text-foreground text-lg">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions && <div>{actions}</div>}
          <MobileMenu items={menuItems} />
        </div>
      </div>
    </header>
  )
}

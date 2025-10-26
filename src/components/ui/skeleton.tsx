'use client'

import * as React from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200/70 dark:bg-zinc-800/60 ${className}`} />
  )
}



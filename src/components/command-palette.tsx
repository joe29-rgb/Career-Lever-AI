'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Briefcase, Home, Settings, Users, BarChart3, Target } from 'lucide-react'

interface Command {
  id: string
  label: string
  icon: any
  href: string
  keywords: string[]
}

const commands: Command[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard', keywords: ['home', 'main'] },
  { id: 'search', label: 'Job Search', icon: Search, href: '/career-finder/search', keywords: ['jobs', 'find', 'search'] },
  { id: 'analysis', label: 'Job Analysis', icon: Target, href: '/career-finder/job-analysis', keywords: ['analyze', 'match'] },
  { id: 'company', label: 'Company Research', icon: Briefcase, href: '/career-finder/company', keywords: ['research', 'employer'] },
  { id: 'optimizer', label: 'Resume Optimizer', icon: FileText, href: '/career-finder/optimizer', keywords: ['resume', 'optimize', 'tailor'] },
  { id: 'cover', label: 'Cover Letter', icon: FileText, href: '/career-finder/cover-letter', keywords: ['letter', 'cover'] },
  { id: 'outreach', label: 'Outreach', icon: Users, href: '/career-finder/outreach', keywords: ['send', 'email', 'apply'] },
  { id: 'resume', label: 'Resume Builder', icon: FileText, href: '/resume-builder', keywords: ['create', 'build'] },
  { id: 'applications', label: 'Applications', icon: Briefcase, href: '/applications', keywords: ['track', 'apps'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics', keywords: ['stats', 'metrics'] },
  { id: 'network', label: 'Network', icon: Users, href: '/network', keywords: ['contacts', 'connections'] },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', keywords: ['preferences', 'config'] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.keywords.some(kw => kw.includes(query.toLowerCase()))
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
      <div className="w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search commands... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-4 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.href)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-all text-left"
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{cmd.label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

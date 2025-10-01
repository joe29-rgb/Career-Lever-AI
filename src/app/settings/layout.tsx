import { ReactNode } from 'react'
import Link from 'next/link'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="flex items-center gap-4 mb-6 border-b pb-2 text-sm">
          <Link href="/settings/alerts" className="text-blue-600 hover:text-blue-800">Alerts</Link>
          <Link href="/settings/integrations" className="text-blue-600 hover:text-blue-800">Integrations</Link>
          <Link href="/settings/privacy" className="text-blue-600 hover:text-blue-800">Privacy</Link>
          <Link href="/settings/preferences" className="text-blue-600 hover:text-blue-800">Preferences</Link>
          <Link href="/settings/job-boards" className="text-blue-600 hover:text-blue-800">Job Boards</Link>
        </div>
        {children}
      </div>
    </div>
  )
}



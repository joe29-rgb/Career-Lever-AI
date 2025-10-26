'use client'

import Link from 'next/link'

export default function JobBoardsSettingsIndex() {
  return (
    <div className="space-y-3">
      <div className="text-sm text-foreground">Manage your job board integrations and preferences.</div>
      <div className="text-sm">
        Go to <Link className="underline" href="/settings/integrations">Integrations</Link> to connect boards.
      </div>
      <div className="text-sm">
        Use <Link className="underline" href="/job-boards">Job Boards</Link> to run Autopilot and review public listings.
      </div>
    </div>
  )
}




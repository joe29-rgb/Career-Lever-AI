import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobsActions } from './components/jobs-actions'

export default async function JobsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <JobImport />
      <CalendarQuick />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Import from Connected Boards</h2>
        <JobsActions />
      </section>
    </div>
  )
}

function JobImport() {
  async function importAction(formData: FormData) {
    'use server'
    const jobUrl = String(formData.get('jobUrl') || '')
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/jobs/import`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobUrl })
    })
    // no-op, page can show toast client-side in future
  }
  return (
    <form action={importAction} className="space-y-3">
      <label className="block text-sm font-medium">Import job from URL</label>
      <input name="jobUrl" type="url" placeholder="Paste job link (LinkedIn, Indeed, etc.)" className="w-full border rounded p-2" required />
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Import</button>
    </form>
  )
}

function CalendarQuick() {
  async function createAction(formData: FormData) {
    'use server'
    const payload = {
      summary: String(formData.get('summary') || ''),
      start: String(formData.get('start') || ''),
      end: String(formData.get('end') || ''),
      description: String(formData.get('description') || ''),
      location: String(formData.get('location') || '')
    }
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/calendar/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  }
  return (
    <form action={createAction} className="space-y-3">
      <h2 className="text-lg font-semibold">Quick Calendar Event</h2>
      <input name="summary" placeholder="Interview with Acme" className="w-full border rounded p-2" required />
      <input name="start" type="datetime-local" className="w-full border rounded p-2" required />
      <input name="end" type="datetime-local" className="w-full border rounded p-2" required />
      <input name="location" placeholder="Google Meet" className="w-full border rounded p-2" />
      <textarea name="description" placeholder="Notes" className="w-full border rounded p-2" />
      <button className="px-4 py-2 bg-green-600 text-white rounded">Create Event</button>
    </form>
  )
}



import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobsActions } from './components/jobs-actions'
import { LocalDiscover } from './components/local-discover'
import { t, type Locale } from '@/lib/i18n'

export default async function JobsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')
  const locale = ((await import('next/headers')).headers().get('x-locale') || 'en') as Locale
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t(locale, 'jobs.pageTitle', 'Jobs')}</h1>
      <PrefillSuggestBanner />
      <JobImport />
      <SearchImport />
      <section className="space-y-3">
        <LocalDiscover />
      </section>
      <CalendarQuick />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Import from Connected Boards</h2>
        <JobsActions />
      </section>
      <Recommendations />
    </div>
  )
}

function PrefillSuggestBanner() {
  if (typeof window === 'undefined') return null as any
  let last: any = null
  try { const raw = localStorage.getItem('jobs:lastSuggest'); if (raw) last = JSON.parse(raw) } catch {}
  if (!last || !Array.isArray(last.results) || last.results.length === 0) return null as any
  return (
    <div className="border rounded p-3 bg-blue-50 text-sm">
      <div className="font-medium mb-1">Suggested jobs for {last.titles?.join(', ')}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {last.results.slice(0,6).map((r:any,i:number)=> (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="border rounded p-2 bg-white hover:shadow">
            <div className="text-gray-500 text-xs mb-1">{r.source}</div>
            <div className="font-medium line-clamp-1">{r.title || r.url}</div>
            {r.snippet && <div className="text-xs text-gray-600 line-clamp-2 mt-1">{r.snippet}</div>}
          </a>
        ))}
      </div>
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

function SearchImport() {
  async function importSearch(formData: FormData) {
    'use server'
    const searchUrl = String(formData.get('searchUrl') || '')
    const limit = Number(formData.get('limit') || '15')
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/jobs/scrape/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searchUrl, limit })
    })
  }
  return (
    <form action={importSearch} className="space-y-3">
      <label className="block text-sm font-medium">Bulk import by search URL (Indeed, ZipRecruiter, Job Bank, Google Jobs)</label>
      <input name="searchUrl" type="url" placeholder="Paste search URL" className="w-full border rounded p-2" required />
      <div className="flex items-center gap-2">
        <input name="limit" type="number" min={1} max={50} defaultValue={15} className="w-24 border rounded p-2" />
        <button className="px-4 py-2 border rounded">Fetch</button>
      </div>
      <p className="text-xs text-gray-500">Only public pages. If a site requires login, use manual import or the upcoming browser extension.</p>
    </form>
  )
}

function Recommendations() {
  async function recommend(formData: FormData) {
    'use server'
    const url1 = String(formData.get('url1') || '')
    const url2 = String(formData.get('url2') || '')
    const url3 = String(formData.get('url3') || '')
    const searchUrls = [url1, url2, url3].filter(Boolean)
    if (searchUrls.length === 0) return
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/jobs/recommend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searchUrls, limitPerSource: 10 })
    })
  }
  return (
    <form action={recommend} className="space-y-3">
      <h2 className="text-lg font-semibold">Recommendations (seed by search URLs)</h2>
      <input name="url1" type="url" placeholder="Search URL #1 (e.g., Indeed)" className="w-full border rounded p-2" />
      <input name="url2" type="url" placeholder="Search URL #2 (optional)" className="w-full border rounded p-2" />
      <input name="url3" type="url" placeholder="Search URL #3 (optional)" className="w-full border rounded p-2" />
      <button className="px-4 py-2 bg-purple-600 text-white rounded">Get Recommendations</button>
      <p className="text-xs text-gray-500">We’ll fetch public jobs from these sources and rank them against your resume.</p>
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



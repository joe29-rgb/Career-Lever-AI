import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import ReverseMarketClient from './reverse-market-client'

export default async function ReverseMarketPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reverse Market</h1>
      <p className="text-sm text-muted-foreground">Create an anonymous showcase so employers can reach out with opportunities.</p>
      <div className="space-y-2">
        <a href="/api/openapi" className="text-xs underline">API Docs</a>
        <div className="text-sm text-foreground">Use the Integrations or API to post your showcase and view bids.</div>
      </div>
      <ReverseMarketClient />
    </div>
  )
}




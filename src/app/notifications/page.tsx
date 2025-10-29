import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationsPage } from './components/notifications-page'

export const metadata: Metadata = {
  title: 'Notifications | Career Lever AI',
  description: 'View and manage your notifications',
}

export default async function Notifications() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/notifications')
  }

  return <NotificationsPage userId={session.user.id} />
}

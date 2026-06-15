import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import GlobalNav from '@/components/ui/GlobalNav'
import ChatClient from './ChatClient'

export const metadata = { title: 'Explorer Chat' }

export default async function ChatPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <GlobalNav />
      <ChatClient userId={user.id} />
    </div>
  )
}

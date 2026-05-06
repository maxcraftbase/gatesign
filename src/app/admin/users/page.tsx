import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { UsersClient } from './users-client'

export default async function UsersPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('/admin')
  return <UsersClient currentUserId={ctx.userId} />
}

import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { UsersClient } from '@/app/admin/users/users-client'
import { SettingsSubNav } from '@/components/admin/SettingsSubNav'

export default async function UsersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('.')
  return (
    <>
      <SettingsSubNav slug={slug} />
      <UsersClient currentUserId={ctx.userId} />
    </>
  )
}

import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AdminSettingsClient } from '@/app/admin/settings/settings-client'

export default async function SettingsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('/admin')
  return <AdminSettingsClient />
}

import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AdminSettingsClient } from '@/app/admin/settings/settings-client'
import { SettingsSubNav } from '@/components/admin/SettingsSubNav'

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('/admin')
  return (
    <>
      <SettingsSubNav slug={slug} />
      <AdminSettingsClient />
    </>
  )
}

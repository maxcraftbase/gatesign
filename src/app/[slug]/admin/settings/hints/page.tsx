import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AdminSettingsClient } from '@/app/admin/settings/settings-client'
import { SettingsShell } from '@/components/admin/SettingsShell'

export default async function HintsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect(`/${slug}/admin`)
  return (
    <SettingsShell slug={slug}>
      <AdminSettingsClient section="hints" />
    </SettingsShell>
  )
}

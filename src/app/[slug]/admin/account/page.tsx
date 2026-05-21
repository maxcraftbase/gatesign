import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { SettingsShell } from '@/components/admin/SettingsShell'
import { AccountClient } from '@/app/admin/account-client'

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect(`/${slug}/admin/login`)

  return (
    <SettingsShell slug={slug}>
      <AccountClient />
    </SettingsShell>
  )
}
